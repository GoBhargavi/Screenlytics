use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{info, warn, error};
use anyhow::{Result, anyhow};

#[derive(Debug, Clone)]
pub struct OllamaService {
    client: Client,
    endpoint: String,
    model: String,
}

#[derive(Debug, Serialize)]
struct GenerateRequest {
    model: String,
    prompt: String,
    stream: bool,
    system: Option<String>,
    context: Option<Vec<i64>>,
}

#[derive(Debug, Deserialize)]
struct GenerateResponse {
    model: String,
    response: String,
    done: bool,
    context: Option<Vec<i64>>,
}

#[derive(Debug, Deserialize)]
struct OllamaModel {
    name: String,
}

#[derive(Debug, Deserialize)]
struct ModelsResponse {
    models: Vec<OllamaModel>,
}

impl OllamaService {
    pub fn new(endpoint: String, model: String) -> Self {
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(120))
            .build()
            .unwrap_or_default();

        Self {
            client,
            endpoint,
            model,
        }
    }

    pub async fn is_available(&self) -> bool {
        let url = format!("{}/api/tags", self.endpoint);
        match self.client.get(&url).send().await {
            Ok(resp) => resp.status().is_success(),
            Err(e) => {
                warn!("Ollama not available: {}", e);
                false
            }
        }
    }

    pub async fn generate(&self, system_prompt: Option<String>, user_prompt: String) -> Result<String> {
        let url = format!("{}/api/generate", self.endpoint);
        
        let request = GenerateRequest {
            model: self.model.clone(),
            prompt: user_prompt,
            stream: false,
            system: system_prompt,
            context: None,
        };

        info!("Sending prompt to Ollama: {}", request.prompt.chars().take(100).collect::<String>());

        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow!("Ollama request failed: {}", response.status()));
        }

        let result: GenerateResponse = response.json().await?;
        
        info!("Received response from Ollama: {} chars", result.response.len());
        
        Ok(result.response.trim().to_string())
    }

    pub async fn chat(&self, messages: Vec<(String, String)>) -> Result<String> {
        // Format messages for Ollama
        let formatted = messages
            .iter()
            .map(|(role, content)| format!("{}: {}", role, content))
            .collect::<Vec<_>>()
            .join("\n");

        let system_prompt = "You are a helpful AI focus coach with access to user's screen activity data. Be concise, specific, and actionable. Reference actual numbers when possible.";

        self.generate(Some(system_prompt.to_string()), formatted).await
    }
}

impl Default for OllamaService {
    fn default() -> Self {
        Self::new(
            "http://localhost:11434".to_string(),
            "llama3.2".to_string(),
        )
    }
}
