use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error};

mod db;
mod tracker;
mod commands;
mod blocker;
mod ai;
mod team;
mod config;
mod integrations;

use db::Database;
use tracker::ActivityTracker;
use ai::OllamaService;
use config::EnterpriseConfig;

#[derive(Debug, Clone)]
pub struct AppState {
    db: Arc<RwLock<Database>>,
    tracker: Arc<RwLock<ActivityTracker>>,
    ai: Arc<RwLock<OllamaService>>,
}

impl AppState {
    pub fn new(db: Database, tracker: ActivityTracker, ai: OllamaService) -> Self {
        Self {
            db: Arc::new(RwLock::new(db)),
            tracker: Arc::new(RwLock::new(tracker)),
            ai: Arc::new(RwLock::new(ai)),
        }
    }
}

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter("info,screenlytics=debug")
        .init();

    info!("Starting Screenlytics Enterprise...");

    // Load enterprise config if available
    let enterprise_config = EnterpriseConfig::load();
    if let Some(ref config) = enterprise_config {
        info!("Enterprise config loaded: company_id={:?}, managed={}", 
            config.company_id, config.is_managed());
    } else {
        info!("No enterprise config found - running in personal mode");
    }

    let app_dir = tauri::api::path::app_data_dir(&tauri::Config::default())
        .expect("Failed to get app data directory");

    std::fs::create_dir_all(&app_dir).expect("Failed to create app directory");

    let db_path = app_dir.join("screenlytics.db");
    info!("Database path: {:?}", db_path);

    let rt = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime");

    let db = rt.block_on(async {
        Database::new(db_path.to_str().unwrap())
            .await
            .expect("Failed to initialize database")
    });

    let tracker = ActivityTracker::new(Arc::new(RwLock::new(db.clone())));
    
    // Use enterprise Ollama config if available, otherwise default
    let ai = if let Some(ref config) = enterprise_config {
        OllamaService::new(config.ollama_endpoint.clone(), config.ollama_model.clone())
    } else {
        OllamaService::default()
    };
    
    let state = AppState::new(db, tracker, ai);

    let state_clone = state.clone();
    rt.spawn(async move {
        let ai = state_clone.ai.clone();
        let ai = ai.read().await;
        if ai.is_available().await {
            info!("Ollama AI service is available");
        } else {
            warn!("Ollama AI service is not available - AI features will be disabled");
        }
    });

    let state_clone = state.clone();
    rt.spawn(async move {
        let tracker = state_clone.tracker.clone();
        let mut tracker = tracker.write().await;
        if let Err(e) = tracker.start().await {
            error!("Failed to start activity tracker: {}", e);
        }
    });

    tauri::Builder::default()
        .manage(state)
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_today_summary,
            commands::get_hourly_data,
            commands::get_app_breakdown,
            commands::get_category_breakdown,
            commands::get_focus_score,
            commands::get_timeline,
            commands::get_weekly_summary,
            commands::start_tracking,
            commands::stop_tracking,
            commands::start_focus_session,
            commands::stop_focus_session,
            commands::get_active_focus_session,
            commands::get_settings,
            commands::update_settings,
            commands::export_data,
            commands::delete_data,
            commands::get_ai_insights,
            commands::chat_with_ai,
            commands::get_team_summary,
            commands::toggle_team_sharing,
            commands::get_calendar_events,
            commands::get_work_items,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
