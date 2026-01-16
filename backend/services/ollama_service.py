"""
Ollama AI service for generating screen time insights.
Connects to local Ollama instance for LLM-powered analysis.
"""

import httpx
import json
from typing import Optional

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2"


async def check_ollama_status() -> bool:
    """Check if Ollama is running and accessible."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return response.status_code == 200
    except Exception:
        return False


async def generate_insights(screen_data: dict, model: str = DEFAULT_MODEL) -> list[dict]:
    """Generate AI-powered insights from screen time data."""
    
    # Build context from data
    summary = screen_data.get("summary", {})
    categories = screen_data.get("categories", [])
    daily = screen_data.get("daily", [])[-7:]  # Last 7 days
    
    prompt = f"""You are a helpful digital wellness assistant analyzing screen time data. 
Based on the following data, provide exactly 4 brief, actionable insights.

Weekly Summary:
- Total screen time: {summary.get('total_hours', 0)} hours
- Daily average: {summary.get('daily_average', 0)} minutes
- Trend: {summary.get('trend', 'stable')} by {summary.get('trend_percentage', 0)}%

Top Categories:
{json.dumps(categories[:3], indent=2)}

Recent Daily Usage (last 7 days):
{json.dumps(daily, indent=2)}

Provide exactly 4 insights in this JSON format:
[
  {{"type": "warning|success|info|tip", "title": "Short Title", "message": "Brief actionable message (max 100 chars)"}},
  ...
]

Only output valid JSON, no other text."""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 500,
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                text = result.get("response", "")
                
                # Parse JSON from response
                try:
                    # Find JSON array in response
                    start = text.find("[")
                    end = text.rfind("]") + 1
                    if start != -1 and end > start:
                        insights = json.loads(text[start:end])
                        return insights
                except json.JSONDecodeError:
                    pass
            
            return get_fallback_insights(screen_data)
            
    except Exception as e:
        print(f"Ollama error: {e}")
        return get_fallback_insights(screen_data)


async def chat_with_ai(question: str, screen_data: dict, model: str = DEFAULT_MODEL) -> str:
    """Interactive chat about screen time habits."""
    
    summary = screen_data.get("summary", {})
    categories = screen_data.get("categories", [])
    apps = screen_data.get("apps", [])[:5]
    
    prompt = f"""You are a helpful digital wellness assistant. Answer the user's question based on their screen time data.

User's Screen Time Context:
- Weekly total: {summary.get('total_hours', 0)} hours
- Daily average: {summary.get('daily_average', 0)} minutes  
- Trend: {summary.get('trend', 'stable')} by {summary.get('trend_percentage', 0)}%
- Top categories: {', '.join([c['category'] for c in categories[:3]])}
- Top apps: {', '.join([a['app_name'] for a in apps])}
- Peak day: {summary.get('peak_day', {}).get('day_of_week', 'Unknown')}

User Question: {question}

Provide a helpful, concise response (2-3 sentences max). Be encouraging and actionable."""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 200,
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "I'm having trouble analyzing your data right now. Please try again.")
            
            return "Unable to connect to AI service. Please ensure Ollama is running."
            
    except Exception as e:
        print(f"Ollama chat error: {e}")
        return "Unable to connect to AI service. Please ensure Ollama is running on localhost:11434."


def get_fallback_insights(screen_data: dict) -> list[dict]:
    """Fallback insights when Ollama is unavailable."""
    summary = screen_data.get("summary", {})
    avg = summary.get("daily_average", 0)
    trend = summary.get("trend", "stable")
    
    insights = [
        {
            "type": "info",
            "title": "Weekly Overview",
            "message": f"You averaged {avg} minutes of screen time daily this week."
        },
        {
            "type": "tip",
            "title": "Peak Usage Time",
            "message": "Consider setting app limits during your highest usage hours (6-10 PM)."
        },
    ]
    
    if trend == "up":
        insights.append({
            "type": "warning", 
            "title": "Usage Trending Up",
            "message": f"Your screen time increased by {summary.get('trend_percentage', 0)}% this week."
        })
    else:
        insights.append({
            "type": "success",
            "title": "Great Progress",
            "message": f"Your screen time decreased by {summary.get('trend_percentage', 0)}% this week!"
        })
    
    insights.append({
        "type": "tip",
        "title": "Social Media Balance", 
        "message": "Try the 20-20-20 rule: every 20 mins, look 20 feet away for 20 seconds."
    })
    
    return insights
