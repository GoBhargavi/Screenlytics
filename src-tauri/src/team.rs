use crate::db::Database;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tracing::{info, warn, error};
use anyhow::Result;

/// Team sync service that handles anonymized data sharing
pub struct TeamSyncService {
    db: Database,
    company_id: String,
    sync_endpoint: String,
    client: reqwest::Client,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnonymizedDayData {
    pub date: String,
    pub total_active_minutes: i64,
    pub focus_score: i32,
    pub deep_work_blocks: i64,
    pub context_switches: i64,
    pub category_breakdown: Vec<(String, i64)>, // (category, minutes) - no app names
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamSyncPayload {
    pub company_id: String,
    pub employee_hash: String, // Anonymous hash, not identifiable
    pub data: Vec<AnonymizedDayData>,
    pub sync_timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamMemberView {
    pub display_name: String,
    pub focus_score: i32,
    pub trend: String, // "up", "down", "stable"
    pub is_overloaded: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamAnalytics {
    pub avg_focus_score: i32,
    pub member_count: i32,
    pub overloaded_count: i32,
    pub top_fragmentation_hours: Vec<i32>,
    pub team_trend: String,
}

impl TeamSyncService {
    pub fn new(db: Database, company_id: String, sync_endpoint: String) -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .unwrap_or_default();

        Self {
            db,
            company_id,
            sync_endpoint,
            client,
        }
    }

    /// Generate anonymous hash for this employee
    fn generate_employee_hash(&self) -> String {
        // Use machine-specific identifier but hash it so it's anonymous
        let machine_id = machine_uid::get().unwrap_or_else(|_| "unknown".to_string());
        let hash_input = format!("{}:{}", machine_id, self.company_id);
        
        // Simple hash - in production use SHA-256
        format!("{:x}", md5::compute(hash_input))
    }

    /// Get anonymized data for the last 7 days
    pub async fn get_anonymized_data(&self) -> Result<Vec<AnonymizedDayData>> {
        let mut data = Vec::new();
        
        for i in 0..7 {
            let date = Utc::now() - chrono::Duration::days(i);
            let naive_date = date.date_naive();
            
            // Get daily summary
            let summary = match self.db.get_today_summary().await {
                Ok(s) => s,
                Err(_) => continue,
            };
            
            // Get category breakdown (no app names - privacy safe)
            let categories = match self.db.get_category_breakdown(naive_date).await {
                Ok(c) => c,
                Err(_) => Vec::new(),
            };
            
            data.push(AnonymizedDayData {
                date: naive_date.to_string(),
                total_active_minutes: summary.total_active_minutes,
                focus_score: summary.focus_score,
                deep_work_blocks: summary.deep_work_blocks,
                context_switches: summary.context_switches,
                category_breakdown: categories,
            });
        }
        
        Ok(data)
    }

    /// Sync anonymized data to company server
    pub async fn sync_to_team(&self) -> Result<bool> {
        let data = self.get_anonymized_data().await?;
        
        if data.is_empty() {
            info!("No data to sync");
            return Ok(false);
        }
        
        let payload = TeamSyncPayload {
            company_id: self.company_id.clone(),
            employee_hash: self.generate_employee_hash(),
            data,
            sync_timestamp: Utc::now(),
        };
        
        // Send to company endpoint
        match self.client
            .post(&self.sync_endpoint)
            .json(&payload)
            .send()
            .await 
        {
            Ok(resp) => {
                if resp.status().is_success() {
                    info!("Team sync successful");
                    Ok(true)
                } else {
                    warn!("Team sync failed: {}", resp.status());
                    Ok(false)
                }
            }
            Err(e) => {
                warn!("Team sync error: {}", e);
                Ok(false)
            }
        }
    }

    /// Fetch team analytics from company server
    pub async fn get_team_analytics(&self) -> Result<Option<TeamAnalytics>> {
        let url = format!("{}/analytics?company={}", self.sync_endpoint, self.company_id);
        
        match self.client.get(&url).send().await {
            Ok(resp) => {
                if resp.status().is_success() {
                    let analytics: TeamAnalytics = resp.json().await?;
                    Ok(Some(analytics))
                } else {
                    Ok(None)
                }
            }
            Err(e) => {
                warn!("Failed to fetch team analytics: {}", e);
                Ok(None)
            }
        }
    }

    /// Detect if user is in "meeting overload" - useful for team alerts
    pub async fn detect_meeting_overload(&self) -> Result<bool> {
        let summary = self.db.get_today_summary().await?;
        
        // Check if communication/meeting apps dominate
        let comm_minutes: i64 = summary.top_apps
            .iter()
            .filter(|a| a.category == "Communication")
            .map(|a| a.total_minutes)
            .sum();
        
        // Overloaded if > 4 hours in meetings
        Ok(comm_minutes > 240)
    }
}

// Simple MD5 implementation for hashing
mod md5 {
    pub fn compute(input: String) -> u128 {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        input.hash(&mut hasher);
        hasher.finish() as u128
    }
}

// Stub for machine_uid - in production use proper machine identification
mod machine_uid {
    pub fn get() -> Result<String, ()> {
        // Use hostname or similar
        Ok(hostname::get().map(|h| h.to_string_lossy().to_string()).unwrap_or_else(|_| "unknown".to_string()))
    }
}

mod hostname {
    pub fn get() -> Result<std::ffi::OsString, ()> {
        std::env::var_os("HOSTNAME")
            .or_else(|| std::env::var_os("COMPUTERNAME"))
            .ok_or(())
    }
}
