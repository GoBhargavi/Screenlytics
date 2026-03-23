use crate::{AppState, db, integrations};
use serde::{Deserialize, Serialize};
use tauri::State;
use anyhow::Result;

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn err(msg: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(msg),
        }
    }
}

#[tauri::command]
pub async fn get_today_summary(state: State<'_, AppState>) -> Result<ApiResponse<db::DailySummary>, ()> {
    let db = state.db.read().await;
    match db.get_today_summary().await {
        Ok(summary) => Ok(ApiResponse::ok(summary)),
        Err(e) => Ok(ApiResponse::err(format!("Failed to get today summary: {}", e))),
    }
}

#[tauri::command]
pub async fn get_hourly_data(
    date: String,
    state: State<'_, AppState>
) -> Result<ApiResponse<Vec<db::HourlyData>>, ()> {
    let parsed_date = match chrono::NaiveDate::parse_from_str(&date, "%Y-%m-%d") {
        Ok(d) => d,
        Err(e) => return Ok(ApiResponse::err(format!("Invalid date format: {}", e))),
    };

    let db = state.db.read().await;
    match db.get_hourly_data(parsed_date).await {
        Ok(data) => Ok(ApiResponse::ok(data)),
        Err(e) => Ok(ApiResponse::err(format!("Failed to get hourly data: {}", e))),
    }
}

#[tauri::command]
pub async fn get_app_breakdown(
    date: String,
    state: State<'_, AppState>
) -> Result<ApiResponse<Vec<db::AppUsage>>, ()> {
    let parsed_date = match chrono::NaiveDate::parse_from_str(&date, "%Y-%m-%d") {
        Ok(d) => d,
        Err(e) => return Ok(ApiResponse::err(format!("Invalid date format: {}", e))),
    };

    let db = state.db.read().await;
    match db.get_summary_for_date(parsed_date).await {
        Ok(summary) => Ok(ApiResponse::ok(summary.top_apps)),
        Err(e) => Ok(ApiResponse::err(format!("Failed to get app breakdown: {}", e))),
    }
}

#[tauri::command]
pub async fn get_category_breakdown(
    date: String,
    state: State<'_, AppState>
) -> Result<ApiResponse<Vec<(String, i64)>>, ()> {
    let parsed_date = match chrono::NaiveDate::parse_from_str(&date, "%Y-%m-%d") {
        Ok(d) => d,
        Err(e) => return Ok(ApiResponse::err(format!("Invalid date format: {}", e))),
    };

    let db = state.db.read().await;
    match db.get_category_breakdown(parsed_date).await {
        Ok(data) => Ok(ApiResponse::ok(data)),
        Err(e) => Ok(ApiResponse::err(format!("Failed to get category breakdown: {}", e))),
    }
}

#[tauri::command]
pub async fn get_focus_score(state: State<'_, AppState>) -> Result<ApiResponse<i32>, ()> {
    let db = state.db.read().await;
    match db.get_today_summary().await {
        Ok(summary) => Ok(ApiResponse::ok(summary.focus_score)),
        Err(e) => Ok(ApiResponse::err(format!("Failed to get focus score: {}", e))),
    }
}

#[tauri::command]
pub async fn get_timeline(
    date: String,
    state: State<'_, AppState>
) -> Result<ApiResponse<Vec<db::ActivityRecord>>, ()> {
    let db = state.db.read().await;
    let start = format!("{}T00:00:00", date);
    let end = format!("{}T23:59:59", date);

    match db.export_data(&start, &end).await {
        Ok(records) => Ok(ApiResponse::ok(records)),
        Err(e) => Ok(ApiResponse::err(format!("Failed to get timeline: {}", e))),
    }
}

#[tauri::command]
pub async fn get_weekly_summary(state: State<'_, AppState>) -> Result<ApiResponse<Vec<db::DailySummary>>, ()> {
    let db = state.db.read().await;
    let mut summaries = Vec::new();

    for i in 0..7 {
        let date = chrono::Utc::now() - chrono::Duration::days(i);
        let naive_date = date.date_naive();

        if let Ok(summary) = db.get_summary_for_date(naive_date).await {
            summaries.push(summary);
        }
    }

    Ok(ApiResponse::ok(summaries))
}

#[tauri::command]
pub async fn start_tracking(state: State<'_, AppState>) -> Result<ApiResponse<bool>, ()> {
    let tracker = state.tracker.clone();
    let mut tracker = tracker.write().await;

    match tracker.start().await {
        Ok(_) => Ok(ApiResponse::ok(true)),
        Err(e) => Ok(ApiResponse::err(format!("Failed to start tracking: {}", e))),
    }
}

#[tauri::command]
pub async fn stop_tracking(state: State<'_, AppState>) -> Result<ApiResponse<bool>, ()> {
    let tracker = state.tracker.clone();
    let mut tracker = tracker.write().await;
    tracker.stop();
    Ok(ApiResponse::ok(true))
}

#[tauri::command]
pub async fn start_focus_session(
    duration_minutes: i64,
    blocked_apps: Vec<String>,
    state: State<'_, AppState>
) -> Result<ApiResponse<i64>, ()> {
    let db = state.db.read().await;
    
    // Check if there's already an active session
    match db.get_active_focus_session().await {
        Ok(Some(_)) => {
            return Ok(ApiResponse::err("A focus session is already active".to_string()));
        }
        _ => {}
    }
    
    // Create new session
    match db.start_focus_session(blocked_apps).await {
        Ok(session_id) => Ok(ApiResponse::ok(session_id)),
        Err(e) => Ok(ApiResponse::err(format!("Failed to start focus session: {}", e))),
    }
}

#[tauri::command]
pub async fn stop_focus_session(
    was_completed: bool,
    state: State<'_, AppState>
) -> Result<ApiResponse<bool>, ()> {
    let db = state.db.read().await;
    
    // Get active session
    match db.get_active_focus_session().await {
        Ok(Some(session)) => {
            match db.stop_focus_session(session.id, was_completed).await {
                Ok(_) => Ok(ApiResponse::ok(true)),
                Err(e) => Ok(ApiResponse::err(format!("Failed to stop session: {}", e))),
            }
        }
        Ok(None) => Ok(ApiResponse::err("No active focus session".to_string())),
        Err(e) => Ok(ApiResponse::err(format!("Error: {}", e))),
    }
}

#[tauri::command]
pub async fn get_active_focus_session(state: State<'_, AppState>) -> Result<ApiResponse<Option<db::FocusSession>>, ()> {
    let db = state.db.read().await;
    match db.get_active_focus_session().await {
        Ok(session) => Ok(ApiResponse::ok(session)),
        Err(e) => Ok(ApiResponse::err(format!("Failed to get session: {}", e))),
    }
}

#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<ApiResponse<db::Settings>, ()> {
    let db = state.db.read().await;
    match db.get_settings().await {
        Ok(settings) => Ok(ApiResponse::ok(settings)),
        Err(e) => Ok(ApiResponse::err(format!("Failed to get settings: {}", e))),
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateSettingsRequest {
    pub tracking_enabled: Option<bool>,
    pub idle_threshold_seconds: Option<i64>,
    pub sampling_interval_seconds: Option<i64>,
    pub team_sharing_enabled: Option<bool>,
    pub anonymize_team_data: Option<bool>,
    pub data_retention_days: Option<i64>,
    pub ollama_enabled: Option<bool>,
    pub ollama_model: Option<String>,
    pub ollama_endpoint: Option<String>,
}

#[tauri::command]
pub async fn update_settings(
    request: UpdateSettingsRequest,
    state: State<'_, AppState>
) -> Result<ApiResponse<bool>, ()> {
    let db = state.db.read().await;

    let mut settings = match db.get_settings().await {
        Ok(s) => s,
        Err(e) => return Ok(ApiResponse::err(format!("Failed to get current settings: {}", e))),
    };

    if let Some(v) = request.tracking_enabled { settings.tracking_enabled = v; }
    if let Some(v) = request.idle_threshold_seconds { settings.idle_threshold_seconds = v; }
    if let Some(v) = request.sampling_interval_seconds { settings.sampling_interval_seconds = v; }
    if let Some(v) = request.team_sharing_enabled { settings.team_sharing_enabled = v; }
    if let Some(v) = request.anonymize_team_data { settings.anonymize_team_data = v; }
    if let Some(v) = request.data_retention_days { settings.data_retention_days = v; }
    if let Some(v) = request.ollama_enabled { settings.ollama_enabled = v; }
    if let Some(v) = request.ollama_model { settings.ollama_model = v; }
    if let Some(v) = request.ollama_endpoint { settings.ollama_endpoint = v; }

    match db.update_settings(&settings).await {
        Ok(_) => Ok(ApiResponse::ok(true)),
        Err(e) => Ok(ApiResponse::err(format!("Failed to update settings: {}", e))),
    }
}

#[tauri::command]
pub async fn export_data(
    format: String,
    start_date: String,
    end_date: String,
    state: State<'_, AppState>
) -> Result<ApiResponse<String>, ()> {
    let db = state.db.read().await;

    match db.export_data(&start_date, &end_date).await {
        Ok(records) => {
            let json = match serde_json::to_string(&records) {
                Ok(j) => j,
                Err(e) => return Ok(ApiResponse::err(format!("Failed to serialize data: {}", e))),
            };
            Ok(ApiResponse::ok(json))
        }
        Err(e) => Ok(ApiResponse::err(format!("Failed to export data: {}", e))),
    }
}

#[tauri::command]
pub async fn delete_data(
    older_than_days: i64,
    state: State<'_, AppState>
) -> Result<ApiResponse<u64>, ()> {
    let db = state.db.read().await;
    match db.delete_old_data(older_than_days).await {
        Ok(count) => Ok(ApiResponse::ok(count)),
        Err(e) => Ok(ApiResponse::err(format!("Failed to delete data: {}", e))),
    }
}

// AI and Team commands (placeholders for Phase 3 and 5)

#[derive(Debug, Serialize)]
pub struct AIInsight {
    pub summary: String,
    pub strengths: Vec<String>,
    pub improvements: Vec<String>,
    pub recommendation: String,
}

#[tauri::command]
pub async fn get_ai_insights(state: State<'_, AppState>) -> Result<ApiResponse<AIInsight>, ()> {
    // First get today's summary
    let db = state.db.read().await;
    let summary = match db.get_today_summary().await {
        Ok(s) => s,
        Err(e) => return Ok(ApiResponse::err(format!("Failed to get summary: {}", e))),
    };
    drop(db); // Release the lock before calling AI

    // Build the prompt for Ollama
    let prompt = format!(
        "Analyze this screen activity data and provide insights:\n\n\
        Total active time: {} minutes\n\
        Focus score: {}/100\n\
        Deep work blocks: {}\n\
        Context switches: {}\n\
        Top apps: {}\n\n\
        Provide:\n\
        1. A 1-sentence summary\n\
        2. One specific strength\n\
        3. One specific improvement\n\
        4. One concrete recommendation for tomorrow\n\n\
        Format as: SUMMARY|STRENGTH|IMPROVEMENT|RECOMMENDATION",
        summary.total_active_minutes,
        summary.focus_score,
        summary.deep_work_blocks,
        summary.context_switches,
        summary.top_apps.iter().take(3).map(|a| format!("{} ({}m)", a.app_name, a.total_minutes)).collect::<Vec<_>>().join(", ")
    );

    let system_prompt = "You are a concise AI focus coach. Be direct and specific. Use the data provided.".to_string();

    let ai = state.ai.read().await;
    match ai.generate(Some(system_prompt), prompt).await {
        Ok(response) => {
            // Parse the pipe-separated response
            let parts: Vec<&str> = response.split('|').collect();
            let insight = AIInsight {
                summary: parts.get(0).unwrap_or(&"Analysis complete").to_string(),
                strengths: vec![parts.get(1).unwrap_or(&"Good work habits").to_string()],
                improvements: vec![parts.get(2).unwrap_or(&"Reduce distractions").to_string()],
                recommendation: parts.get(3).unwrap_or(&"Schedule deep work blocks").to_string(),
            };
            Ok(ApiResponse::ok(insight))
        }
        Err(e) => {
            // Fallback to static response if Ollama is not available
            let insight = AIInsight {
                summary: format!("Today you logged {} hours of active time with a focus score of {}/100.", 
                    summary.total_active_minutes / 60, summary.focus_score),
                strengths: vec![format!("You completed {} deep work sessions", summary.deep_work_blocks)],
                improvements: vec!["Consider reducing context switches".to_string()],
                recommendation: "Schedule uninterrupted blocks for complex tasks".to_string(),
            };
            Ok(ApiResponse::ok(insight))
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct ChatRequest {
    pub message: String,
    pub model: Option<String>,
}

#[tauri::command]
pub async fn chat_with_ai(
    request: ChatRequest,
    state: State<'_, AppState>
) -> Result<ApiResponse<String>, ()> {
    let ai = state.ai.read().await;
    
    // Get recent activity data to provide context
    let db = state.db.read().await;
    let summary = match db.get_today_summary().await {
        Ok(s) => s,
        Err(_) => {
            // If we can't get data, just respond without context
            match ai.generate(None, request.message).await {
                Ok(response) => return Ok(ApiResponse::ok(response)),
                Err(_) => return Ok(ApiResponse::ok("I'm having trouble connecting to the AI service. Please make sure Ollama is running locally.".to_string())),
            }
        }
    };
    drop(db);

    let context = format!(
        "User context - Today's focus score: {}/100, Active time: {}m, Deep work: {}\n\nUser question: {}",
        summary.focus_score,
        summary.total_active_minutes,
        summary.deep_work_blocks,
        request.message
    );

    let system_prompt = "You are an AI focus coach. Be concise (2-3 sentences max). Use the user's data to give specific, actionable advice.".to_string();

    match ai.generate(Some(system_prompt), context).await {
        Ok(response) => Ok(ApiResponse::ok(response)),
        Err(_) => Ok(ApiResponse::ok("I'm having trouble connecting to the AI service. Please make sure Ollama is running locally.".to_string())),
    }
}

#[derive(Debug, Serialize)]
pub struct TeamSummary {
    pub team_name: String,
    pub member_count: i32,
    pub avg_focus_score: i32,
    pub top_fragmentation_hours: Vec<i32>,
}

#[tauri::command]
pub async fn get_team_summary(state: State<'_, AppState>) -> Result<ApiResponse<TeamSummary>, ()> {
    // For now, return placeholder data
    // In full implementation, this would use the team sync service
    let summary = TeamSummary {
        team_name: "Engineering".to_string(),
        member_count: 0,
        avg_focus_score: 0,
        top_fragmentation_hours: vec![],
    };
    Ok(ApiResponse::ok(summary))
}

#[tauri::command]
pub async fn toggle_team_sharing(
    enabled: bool,
    state: State<'_, AppState>
) -> Result<ApiResponse<bool>, ()> {
    let db = state.db.read().await;
    
    let mut settings = match db.get_settings().await {
        Ok(s) => s,
        Err(e) => return Ok(ApiResponse::err(format!("Failed to get settings: {}", e))),
    };
    
    settings.team_sharing_enabled = enabled;
    
    match db.update_settings(&settings).await {
        Ok(_) => Ok(ApiResponse::ok(enabled)),
        Err(e) => Ok(ApiResponse::err(format!("Failed to update settings: {}", e))),
    }
}

// Integration commands
#[tauri::command]
pub async fn get_calendar_events(
    state: State<'_, AppState>
) -> Result<ApiResponse<Vec<integrations::CalendarEvent>>, ()> {
    let db = state.db.read().await;
    let settings = match db.get_settings().await {
        Ok(s) => s,
        Err(e) => return Ok(ApiResponse::err(format!("Failed to get settings: {}", e))),
    };
    
    // For now, return empty - in full implementation, fetch from DB stored ICS URLs
    let events: Vec<integrations::CalendarEvent> = Vec::new();
    Ok(ApiResponse::ok(events))
}

#[tauri::command]
pub async fn get_work_items(
    state: State<'_, AppState>
) -> Result<ApiResponse<Vec<integrations::WorkItem>>, ()> {
    let db = state.db.read().await;
    let settings = match db.get_settings().await {
        Ok(s) => s,
        Err(e) => return Ok(ApiResponse::err(format!("Failed to get settings: {}", e))),
    };
    
    // For now, return empty - in full implementation, fetch from JIRA/Linear APIs
    let items: Vec<integrations::WorkItem> = Vec::new();
    Ok(ApiResponse::ok(items))
}
