use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tracing::{info, warn};
use anyhow::Result;

/// Enterprise configuration loaded from system directories
/// This allows IT admins to pre-configure deployments
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnterpriseConfig {
    #[serde(default)]
    pub company_id: Option<String>,
    
    #[serde(default)]
    pub team_sync_endpoint: Option<String>,
    
    #[serde(default = "default_ollama_endpoint")]
    pub ollama_endpoint: String,
    
    #[serde(default = "default_ollama_model")]
    pub ollama_model: String,
    
    #[serde(default)]
    pub privacy_mode: Option<String>, // "anonymized", "full", "disabled"
    
    #[serde(default = "default_retention_days")]
    pub data_retention_days: i64,
    
    #[serde(default)]
    pub sso_provider: Option<String>,
    
    #[serde(default)]
    pub sso_metadata_url: Option<String>,
    
    #[serde(default)]
    pub disable_settings: bool, // Lock settings for managed deployments
}

fn default_ollama_endpoint() -> String {
    "http://localhost:11434".to_string()
}

fn default_ollama_model() -> String {
    "llama3.2".to_string()
}

fn default_retention_days() -> i64 {
    90
}

impl Default for EnterpriseConfig {
    fn default() -> Self {
        Self {
            company_id: None,
            team_sync_endpoint: None,
            ollama_endpoint: default_ollama_endpoint(),
            ollama_model: default_ollama_model(),
            privacy_mode: Some("anonymized".to_string()),
            data_retention_days: default_retention_days(),
            sso_provider: None,
            sso_metadata_url: None,
            disable_settings: false,
        }
    }
}

impl EnterpriseConfig {
    /// Load enterprise config from system paths
    /// macOS/Linux: /etc/screenlytics/config.json
    /// Windows: C:\ProgramData\Screenlytics\config.json
    pub fn load() -> Option<Self> {
        let config_paths = Self::get_config_paths();
        
        for path in config_paths {
            if path.exists() {
                info!("Loading enterprise config from: {:?}", path);
                match std::fs::read_to_string(&path) {
                    Ok(contents) => {
                        match serde_json::from_str::<EnterpriseConfig>(&contents) {
                            Ok(config) => {
                                info!("Enterprise config loaded successfully");
                                return Some(config);
                            }
                            Err(e) => {
                                warn!("Failed to parse enterprise config: {}", e);
                            }
                        }
                    }
                    Err(e) => {
                        warn!("Failed to read enterprise config: {}", e);
                    }
                }
            }
        }
        
        None
    }
    
    fn get_config_paths() -> Vec<PathBuf> {
        let mut paths = Vec::new();
        
        #[cfg(target_os = "macos")]
        {
            paths.push(PathBuf::from("/etc/screenlytics/config.json"));
            paths.push(PathBuf::from("/Library/Application Support/Screenlytics/config.json"));
        }
        
        #[cfg(target_os = "linux")]
        {
            paths.push(PathBuf::from("/etc/screenlytics/config.json"));
            paths.push(PathBuf::from("/usr/local/etc/screenlytics/config.json"));
        }
        
        #[cfg(target_os = "windows")]
        {
            if let Ok(program_data) = std::env::var("ProgramData") {
                paths.push(PathBuf::from(&program_data).join("Screenlytics").join("config.json"));
            }
            paths.push(PathBuf::from("C:\\ProgramData\\Screenlytics\\config.json"));
        }
        
        // Also check for local config in dev
        if cfg!(debug_assertions) {
            paths.push(PathBuf::from("./enterprise-config.json"));
        }
        
        paths
    }
    
    /// Check if running in enterprise/managed mode
    pub fn is_managed(&self) -> bool {
        self.company_id.is_some() || self.disable_settings
    }
    
    /// Get effective company ID (hashed for privacy)
    pub fn get_company_hash(&self) -> Option<String> {
        self.company_id.as_ref().map(|id| {
            // Simple hash - in production use proper hashing
            format!("{:x}", md5::compute(id.clone()))
        })
    }
}

// Simple MD5 implementation
mod md5 {
    pub fn compute(input: String) -> u128 {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        input.hash(&mut hasher);
        hasher.finish() as u128
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_default_config() {
        let config = EnterpriseConfig::default();
        assert_eq!(config.ollama_endpoint, "http://localhost:11434");
        assert_eq!(config.ollama_model, "llama3.2");
        assert_eq!(config.data_retention_days, 90);
        assert!(!config.is_managed());
    }
    
    #[test]
    fn test_managed_detection() {
        let mut config = EnterpriseConfig::default();
        assert!(!config.is_managed());
        
        config.company_id = Some("acme-corp".to_string());
        assert!(config.is_managed());
    }
}
