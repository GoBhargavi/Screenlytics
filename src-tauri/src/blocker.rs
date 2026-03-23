use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn, error};

#[derive(Debug, Clone)]
pub struct AppBlocker {
    blocked_apps: Arc<RwLock<HashSet<String>>>,
    blocked_urls: Arc<RwLock<HashSet<String>>>,
    is_blocking: Arc<RwLock<bool>>,
}

impl AppBlocker {
    pub fn new() -> Self {
        Self {
            blocked_apps: Arc::new(RwLock::new(HashSet::new())),
            blocked_urls: Arc::new(RwLock::new(HashSet::new())),
            is_blocking: Arc::new(RwLock::new(false)),
        }
    }

    pub async fn start_blocking(&self, apps: Vec<String>, urls: Vec<String>) -> anyhow::Result<()> {
        info!("Starting app blocking for {} apps and {} URLs", apps.len(), urls.len());

        {
            let mut blocked = self.blocked_apps.write().await;
            blocked.clear();
            blocked.extend(apps);
        }

        {
            let mut blocked = self.blocked_urls.write().await;
            blocked.clear();
            blocked.extend(urls);
        }

        {
            let mut is_blocking = self.is_blocking.write().await;
            *is_blocking = true;
        }

        #[cfg(target_os = "macos")]
        self.setup_macos_blocking().await?;

        #[cfg(target_os = "windows")]
        self.setup_windows_blocking().await?;

        #[cfg(target_os = "linux")]
        self.setup_linux_blocking().await?;

        Ok(())
    }

    pub async fn stop_blocking(&self) -> anyhow::Result<()> {
        info!("Stopping app blocking");

        {
            let mut is_blocking = self.is_blocking.write().await;
            *is_blocking = false;
        }

        {
            let mut blocked = self.blocked_apps.write().await;
            blocked.clear();
        }

        {
            let mut blocked = self.blocked_urls.write().await;
            blocked.clear();
        }

        Ok(())
    }

    pub async fn is_app_blocked(&self, app_name: &str) -> bool {
        let blocked = self.blocked_apps.read().await;
        let is_blocking = self.is_blocking.read().await;

        *is_blocking && blocked.iter().any(|blocked_app| {
            app_name.to_lowercase().contains(&blocked_app.to_lowercase())
        })
    }

    pub async fn is_url_blocked(&self, url: &str) -> bool {
        let blocked = self.blocked_urls.read().await;
        let is_blocking = self.is_blocking.read().await;

        *is_blocking && blocked.iter().any(|blocked_url| {
            url.to_lowercase().contains(&blocked_url.to_lowercase())
        })
    }

    #[cfg(target_os = "macos")]
    async fn setup_macos_blocking(&self) -> anyhow::Result<()> {
        // macOS app blocking implementation
        // This would use AppleScript or Swift to:
        // 1. Minimize/hide blocked apps when they become active
        // 2. Show a focus session overlay
        // For now, this is a placeholder for Phase 4 implementation
        info!("macOS blocking setup (placeholder)");
        Ok(())
    }

    #[cfg(target_os = "windows")]
    async fn setup_windows_blocking(&self) -> anyhow::Result<()> {
        // Windows app blocking implementation
        // This would use Windows APIs to:
        // 1. Monitor window activation events
        // 2. Block/hide blocked apps
        // For now, this is a placeholder for Phase 4 implementation
        info!("Windows blocking setup (placeholder)");
        Ok(())
    }

    #[cfg(target_os = "linux")]
    async fn setup_linux_blocking(&self) -> anyhow::Result<()> {
        // Linux app blocking implementation
        // This would use X11/Wayland APIs or wmctrl to:
        // 1. Monitor window focus events
        // 2. Minimize/hide blocked apps
        // For now, this is a placeholder for Phase 4 implementation
        info!("Linux blocking setup (placeholder)");
        Ok(())
    }
}

// Default distracting apps/URLs to block during focus sessions
pub fn get_default_distracting_apps() -> Vec<String> {
    vec![
        "YouTube".to_string(),
        "TikTok".to_string(),
        "Instagram".to_string(),
        "Twitter".to_string(),
        "X".to_string(),
        "Reddit".to_string(),
        "Facebook".to_string(),
        "Netflix".to_string(),
        "Disney+".to_string(),
        "Spotify".to_string(),
        "Steam".to_string(),
        "Discord".to_string(),
    ]
}

pub fn get_default_distracting_urls() -> Vec<String> {
    vec![
        "youtube.com".to_string(),
        "tiktok.com".to_string(),
        "instagram.com".to_string(),
        "twitter.com".to_string(),
        "x.com".to_string(),
        "reddit.com".to_string(),
        "facebook.com".to_string(),
        "netflix.com".to_string(),
        "disneyplus.com".to_string(),
        "twitch.tv".to_string(),
        "news.ycombinator.com".to_string(), // Hacker News
        "buzzfeed.com".to_string(),
    ]
}
