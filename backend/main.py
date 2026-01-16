"""
FastAPI Backend for Screen Time Analytics with Ollama AI Integration.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from services import data_service, ollama_service

app = FastAPI(
    title="Screen Time Analytics API",
    description="AI-powered screen time insights using Ollama",
    version="1.0.0"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class ChatRequest(BaseModel):
    question: str
    model: Optional[str] = "llama3.2"


class ChatResponse(BaseModel):
    answer: str
    success: bool


class InsightItem(BaseModel):
    type: str
    title: str
    message: str


# ============ API Endpoints ============

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Screen Time Analytics API"}


@app.get("/api/health")
async def health_check():
    """Check API and Ollama status."""
    ollama_status = await ollama_service.check_ollama_status()
    return {
        "api": "healthy",
        "ollama": "connected" if ollama_status else "disconnected",
    }


@app.get("/api/daily")
async def get_daily_data(days: int = 30):
    """Get daily screen time data."""
    try:
        data = data_service.generate_daily_data(days)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/apps")
async def get_app_usage():
    """Get app usage breakdown."""
    try:
        data = data_service.generate_app_usage()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/hourly")
async def get_hourly_distribution():
    """Get hourly usage distribution."""
    try:
        data = data_service.generate_hourly_distribution()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/categories")
async def get_category_breakdown():
    """Get usage breakdown by category."""
    try:
        data = data_service.generate_category_breakdown()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/summary")
async def get_summary():
    """Get weekly summary statistics."""
    try:
        data = data_service.get_weekly_summary()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/insights")
async def get_ai_insights(model: str = "llama3.2"):
    """Get AI-generated insights from screen time data."""
    try:
        all_data = data_service.get_all_data()
        insights = await ollama_service.generate_insights(all_data, model)
        return {"insights": insights, "generated": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """Interactive AI chat about screen time habits."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    try:
        all_data = data_service.get_all_data()
        answer = await ollama_service.chat_with_ai(
            request.question, 
            all_data, 
            request.model
        )
        return ChatResponse(answer=answer, success=True)
    except Exception as e:
        return ChatResponse(
            answer=f"Sorry, I encountered an error: {str(e)}", 
            success=False
        )


@app.get("/api/dashboard")
async def get_dashboard_data():
    """Get all data needed for the dashboard in a single request."""
    try:
        all_data = data_service.get_all_data()
        insights = await ollama_service.generate_insights(all_data)
        
        return {
            "daily": all_data["daily"],
            "apps": all_data["apps"],
            "hourly": all_data["hourly"],
            "categories": all_data["categories"],
            "summary": all_data["summary"],
            "insights": insights,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
