use crate::db::{Database, ActivityRecord};
use chrono::Utc;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{interval, Duration};
use tracing::{debug, info, warn, error};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct WindowInfo {
    pub app_name: String,
    pub window_title: String,
    pub url: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ActivityTracker {
    db: Arc<RwLock<Database>>,
    is_tracking: bool,
    last_window: Option<WindowInfo>,
    last_active: chrono::DateTime<Utc>,
    idle_threshold_seconds: u64,
    app_categories: HashMap<String, String>,
}

impl ActivityTracker {
    pub fn new(db: Arc<RwLock<Database>>) -> Self {
        let mut app_categories = HashMap::new();

        // Development
        app_categories.insert("Code".to_string(), "Development".to_string());
        app_categories.insert("Visual Studio Code".to_string(), "Development".to_string());
        app_categories.insert("Cursor".to_string(), "Development".to_string());
        app_categories.insert("IntelliJ IDEA".to_string(), "Development".to_string());
        app_categories.insert("WebStorm".to_string(), "Development".to_string());
        app_categories.insert("Xcode".to_string(), "Development".to_string());
        app_categories.insert("Terminal".to_string(), "Development".to_string());
        app_categories.insert("iTerm2".to_string(), "Development".to_string());
        app_categories.insert("Warp".to_string(), "Development".to_string());
        app_categories.insert("GitHub Desktop".to_string(), "Development".to_string());
        app_categories.insert("Docker Desktop".to_string(), "Development".to_string());

        // Communication
        app_categories.insert("Slack".to_string(), "Communication".to_string());
        app_categories.insert("Microsoft Teams".to_string(), "Communication".to_string());
        app_categories.insert("Discord".to_string(), "Communication".to_string());
        app_categories.insert("Zoom".to_string(), "Communication".to_string());
        app_categories.insert("Google Meet".to_string(), "Communication".to_string());
        app_categories.insert("Webex".to_string(), "Communication".to_string());

        // Browsers (will be categorized by URL in production)
        app_categories.insert("Google Chrome".to_string(), "Browsing".to_string());
        app_categories.insert("Safari".to_string(), "Browsing".to_string());
        app_categories.insert("Firefox".to_string(), "Browsing".to_string());
        app_categories.insert("Arc".to_string(), "Browsing".to_string());
        app_categories.insert("Edge".to_string(), "Browsing".to_string());

        // Productivity
        app_categories.insert("Notion".to_string(), "Productivity".to_string());
        app_categories.insert("Obsidian".to_string(), "Productivity".to_string());
        app_categories.insert("Linear".to_string(), "Productivity".to_string());
        app_categories.insert("Jira".to_string(), "Productivity".to_string());
        app_categories.insert("Trello".to_string(), "Productivity".to_string());
        app_categories.insert("Figma".to_string(), "Productivity".to_string());
        app_categories.insert("Adobe XD".to_string(), "Productivity".to_string());

        // Entertainment
        app_categories.insert("YouTube".to_string(), "Entertainment".to_string());
        app_categories.insert("Spotify".to_string(), "Entertainment".to_string());
        app_categories.insert("Apple Music".to_string(), "Entertainment".to_string());
        app_categories.insert("Netflix".to_string(), "Entertainment".to_string());

        Self {
            db,
            is_tracking: false,
            last_window: None,
            last_active: Utc::now(),
            idle_threshold_seconds: 300,
            app_categories,
        }
    }

    pub async fn start(&mut self) -> anyhow::Result<()> {
        if self.is_tracking {
            return Ok(());
        }

        info!("Starting activity tracker...");
        self.is_tracking = true;

        let mut ticker = interval(Duration::from_secs(5));
        let db = self.db.clone();

        while self.is_tracking {
            ticker.tick().await;

            match self.get_active_window() {
                Ok(window_info) => {
                    let is_idle = self.check_idle();
                    let category = self.categorize_app(&window_info.app_name);

                    let record = ActivityRecord {
                        id: 0,
                        timestamp: Utc::now(),
                        app_name: window_info.app_name.clone(),
                        window_title: window_info.window_title.clone(),
                        category,
                        duration_seconds: 5,
                        is_idle,
                    };

                    let db_guard = db.read().await;
                    if let Err(e) = db_guard.insert_activity(&record).await {
                        error!("Failed to insert activity: {}", e);
                    }

                    self.last_window = Some(window_info);
                    if !is_idle {
                        self.last_active = Utc::now();
                    }
                }
                Err(e) => {
                    warn!("Failed to get active window: {}", e);
                }
            }
        }

        info!("Activity tracker stopped");
        Ok(())
    }

    pub fn stop(&mut self) {
        info!("Stopping activity tracker...");
        self.is_tracking = false;
    }

    fn check_idle(&self) -> bool {
        let elapsed = Utc::now().signed_duration_since(self.last_active).num_seconds() as u64;
        elapsed >= self.idle_threshold_seconds
    }

    fn categorize_app(&self, app_name: &str) -> String {
        self.app_categories
            .get(app_name)
            .cloned()
            .unwrap_or_else(|| "Uncategorized".to_string())
    }

    #[cfg(target_os = "macos")]
    fn get_active_window(&self) -> anyhow::Result<WindowInfo> {
        use std::process::Command;
        use serde_json::Value;

        // Use AppleScript to get frontmost app info
        let script = r#"
            tell application "System Events"
                set frontApp to name of first application process whose frontmost is true
            end tell
            tell application frontApp
                set windowTitle to name of front window
            end tell
            return frontApp & "|" & windowTitle
        "#;

        let output = Command::new("osascript")
            .args(&["-e", script])
            .output()?;

        let result = String::from_utf8_lossy(&output.stdout);
        let parts: Vec<&str> = result.trim().split('|').collect();

        if parts.len() >= 2 {
            Ok(WindowInfo {
                app_name: parts[0].to_string(),
                window_title: parts[1].to_string(),
                url: None,
            })
        } else {
            // Fallback: just get frontmost app name
            let script2 = r#"
                tell application "System Events"
                    return name of first application process whose frontmost is true
                end tell
            "#;
            let output2 = Command::new("osascript")
                .args(&["-e", script2])
                .output()?;

            Ok(WindowInfo {
                app_name: String::from_utf8_lossy(&output2.stdout).trim().to_string(),
                window_title: "Unknown".to_string(),
                url: None,
            })
        }
    }

    #[cfg(target_os = "windows")]
    fn get_active_window(&self) -> anyhow::Result<WindowInfo> {
        use std::ffi::OsString;
        use std::os::windows::ffi::OsStringExt;
        use windows::Win32::Foundation::{HWND, GetLastError};
        use windows::Win32::UI::WindowsAndMessaging::GetForegroundWindow;
        use windows::Win32::UI::WindowsAndMessaging::GetWindowTextW;

        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0 == 0 {
                return Err(anyhow::anyhow!("No foreground window"));
            }

            let mut buffer: [u16; 512] = [0; 512];
            let len = GetWindowTextW(hwnd, &mut buffer);

            let window_title = if len > 0 {
                OsString::from_wide(&buffer[..len as usize])
                    .to_string_lossy()
                    .to_string()
            } else {
                "Unknown".to_string()
            };

            // Get process name using GetWindowThreadProcessId + OpenProcess + GetModuleBaseName
            // For now, return with window title only
            Ok(WindowInfo {
                app_name: "Windows App".to_string(), // Would need to get actual process name
                window_title,
                url: None,
            })
        }
    }

    #[cfg(target_os = "linux")]
    fn get_active_window(&self) -> anyhow::Result<WindowInfo> {
        use std::process::Command;

        // Try xdotool first
        let output = Command::new("xdotool")
            .args(&["getactivewindow", "getwindowclassname"])
            .output()?;

        let app_name = if output.status.success() {
            String::from_utf8_lossy(&output.stdout).trim().to_string()
        } else {
            "Unknown".to_string()
        };

        let output2 = Command::new("xdotool")
            .args(&["getactivewindow", "getwindowname"])
            .output()?;

        let window_title = if output2.status.success() {
            String::from_utf8_lossy(&output2.stdout).trim().to_string()
        } else {
            "Unknown".to_string()
        };

        Ok(WindowInfo {
            app_name,
            window_title,
            url: None,
        })
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    fn get_active_window(&self) -> anyhow::Result<WindowInfo> {
        Err(anyhow::anyhow!("Unsupported platform"))
    }
}
