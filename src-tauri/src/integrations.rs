use chrono::{DateTime, Utc, Datelike};
use serde::{Deserialize, Serialize};
use tracing::{info, warn};
use anyhow::Result;

/// Calendar event integration for meeting detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalendarEvent {
    pub id: String,
    pub title: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub is_recurring: bool,
    pub attendees: Vec<String>,
    pub source: CalendarSource,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CalendarSource {
    Google,
    Outlook,
    ICloud,
}

/// Work item from project management tool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkItem {
    pub id: String,
    pub title: String,
    pub url: String,
    pub status: String,
    pub priority: String,
    pub source: WorkItemSource,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WorkItemSource {
    Jira,
    Linear,
    Asana,
}

/// Integration service for calendar and PM tools
pub struct IntegrationService {
    http_client: reqwest::Client,
    settings: IntegrationSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationSettings {
    pub calendar_ics_urls: Vec<String>, // ICS feed URLs
    pub jira_base_url: Option<String>,
    pub jira_api_token: Option<String>,
    pub linear_api_token: Option<String>,
}

impl IntegrationService {
    pub fn new(settings: IntegrationSettings) -> Self {
        let http_client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .unwrap_or_default();

        Self {
            http_client,
            settings,
        }
    }

    /// Fetch calendar events from ICS feeds
    pub async fn get_todays_events(&self) -> Result<Vec<CalendarEvent>> {
        let mut events = Vec::new();

        for url in &self.settings.calendar_ics_urls {
            match self.fetch_ics_feed(url).await {
                Ok(feed_events) => events.extend(feed_events),
                Err(e) => warn!("Failed to fetch ICS feed {}: {}", url, e),
            }
        }

        // Filter to today only
        let today = Utc::now().date_naive();
        events.retain(|e| e.start_time.date_naive() == today);
        
        events.sort_by(|a, b| a.start_time.cmp(&b.start_time));
        
        Ok(events)
    }

    async fn fetch_ics_feed(&self, url: &str) -> Result<Vec<CalendarEvent>> {
        let response = self.http_client.get(url).send().await?;
        let ics_data = response.text().await?;
        
        // Simple ICS parsing - in production use a proper library like ical
        let events = self.parse_ics(&ics_data);
        Ok(events)
    }

    fn parse_ics(&self, ics_data: &str) -> Vec<CalendarEvent> {
        let mut events = Vec::new();
        let lines: Vec<&str> = ics_data.lines().collect();
        
        let mut current_event: Option<CalendarEvent> = None;
        let mut in_event = false;
        
        for line in lines {
            if line.starts_with("BEGIN:VEVENT") {
                in_event = true;
                current_event = Some(CalendarEvent {
                    id: String::new(),
                    title: String::new(),
                    start_time: Utc::now(),
                    end_time: Utc::now(),
                    is_recurring: false,
                    attendees: Vec::new(),
                    source: CalendarSource::Google,
                });
            } else if line.starts_with("END:VEVENT") {
                if let Some(event) = current_event.take() {
                    if !event.id.is_empty() && !event.title.is_empty() {
                        events.push(event);
                    }
                }
                in_event = false;
            } else if in_event {
                if let Some(ref mut event) = current_event {
                    if line.starts_with("UID:") {
                        event.id = line[4..].to_string();
                    } else if line.starts_with("SUMMARY:") {
                        event.title = line[8..].to_string();
                    } else if line.starts_with("DTSTART") {
                        // Parse datetime - simplified
                        if let Some(dt) = self.parse_ics_datetime(line) {
                            event.start_time = dt;
                        }
                    } else if line.starts_with("DTEND") {
                        if let Some(dt) = self.parse_ics_datetime(line) {
                            event.end_time = dt;
                        }
                    } else if line.starts_with("RRULE:") {
                        event.is_recurring = true;
                    }
                }
            }
        }
        
        events
    }

    fn parse_ics_datetime(&self, line: &str) -> Option<DateTime<Utc>> {
        // Simple parser for ICS datetime format
        // DTSTART;TZID=America/New_York:20240115T090000
        // DTSTART:20240115T090000Z
        
        let parts: Vec<&str> = line.split(':').collect();
        if parts.len() < 2 {
            return None;
        }
        
        let dt_str = parts[1];
        // Remove T and parse
        let cleaned = dt_str.replace('T', "");
        
        chrono::NaiveDateTime::parse_from_str(&cleaned, "%Y%m%d%H%M%S")
            .ok()
            .map(|dt| DateTime::from_naive_utc_and_offset(dt, chrono::Utc))
    }

    /// Get assigned work items from JIRA
    pub async fn get_jira_issues(&self) -> Result<Vec<WorkItem>> {
        let Some(ref base_url) = self.settings.jira_base_url else {
            return Ok(Vec::new());
        };
        let Some(ref token) = self.settings.jira_api_token else {
            return Ok(Vec::new());
        };

        let url = format!("{}/rest/api/2/search?jql=assignee=currentuser()", base_url);
        
        let response = self.http_client
            .get(&url)
            .header("Authorization", format!("Bearer {}", token))
            .send()
            .await?;

        if !response.status().is_success() {
            return Ok(Vec::new());
        }

        // Parse JIRA response - simplified
        let json: serde_json::Value = response.json().await?;
        let mut items = Vec::new();

        if let Some(issues) = json["issues"].as_array() {
            for issue in issues {
                items.push(WorkItem {
                    id: issue["key"].as_str().unwrap_or("").to_string(),
                    title: issue["fields"]["summary"].as_str().unwrap_or("").to_string(),
                    url: format!("{}/browse/{}", base_url, issue["key"].as_str().unwrap_or("")),
                    status: issue["fields"]["status"]["name"].as_str().unwrap_or("Unknown").to_string(),
                    priority: issue["fields"]["priority"]["name"].as_str().unwrap_or("Medium").to_string(),
                    source: WorkItemSource::Jira,
                    updated_at: Utc::now(),
                });
            }
        }

        Ok(items)
    }

    /// Get assigned issues from Linear
    pub async fn get_linear_issues(&self) -> Result<Vec<WorkItem>> {
        let Some(ref token) = self.settings.linear_api_token else {
            return Ok(Vec::new());
        };

        let query = r#"
            query {
                viewer {
                    assignedIssues {
                        nodes {
                            id
                            title
                            state {
                                name
                            }
                            priority
                            url
                            updatedAt
                        }
                    }
                }
            }
        "#;

        let response = self.http_client
            .post("https://api.linear.app/graphql")
            .header("Authorization", token)
            .json(&serde_json::json!({ "query": query }))
            .send()
            .await?;

        if !response.status().is_success() {
            return Ok(Vec::new());
        }

        let json: serde_json::Value = response.json().await?;
        let mut items = Vec::new();

        if let Some(nodes) = json["data"]["viewer"]["assignedIssues"]["nodes"].as_array() {
            for node in nodes {
                items.push(WorkItem {
                    id: node["id"].as_str().unwrap_or("").to_string(),
                    title: node["title"].as_str().unwrap_or("").to_string(),
                    url: node["url"].as_str().unwrap_or("").to_string(),
                    status: node["state"]["name"].as_str().unwrap_or("").to_string(),
                    priority: node["priority"].as_i64().map(|p| p.to_string()).unwrap_or("0".to_string()),
                    source: WorkItemSource::Linear,
                    updated_at: Utc::now(),
                });
            }
        }

        Ok(items)
    }

    /// Detect if current time overlaps with a meeting
    pub fn is_in_meeting(&self, events: &[CalendarEvent], now: DateTime<Utc>) -> bool {
        events.iter().any(|e| {
            now >= e.start_time && now <= e.end_time
        })
    }

    /// Calculate meeting load for the day (in minutes)
    pub fn calculate_meeting_load(&self, events: &[CalendarEvent]) -> i64 {
        events.iter().map(|e| {
            let duration = e.end_time.signed_duration_since(e.start_time);
            duration.num_minutes()
        }).sum()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_meeting_detection() {
        let service = IntegrationService::new(IntegrationSettings {
            calendar_ics_urls: vec![],
            jira_base_url: None,
            jira_api_token: None,
            linear_api_token: None,
        });

        let now = Utc::now();
        let events = vec![
            CalendarEvent {
                id: "1".to_string(),
                title: "Test Meeting".to_string(),
                start_time: now - chrono::Duration::minutes(10),
                end_time: now + chrono::Duration::minutes(10),
                is_recurring: false,
                attendees: vec![],
                source: CalendarSource::Google,
            }
        ];

        assert!(service.is_in_meeting(&events, now));
    }
}
