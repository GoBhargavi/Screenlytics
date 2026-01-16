# ScreenTime Pro

AI-powered screen time analytics dashboard with personalized insights using Ollama.

![Dashboard Preview](./docs/preview.png)

## Features

- 📊 **Real-time Analytics** - Track daily, hourly, and category-based screen time
- 🤖 **AI Insights** - Get personalized recommendations powered by Ollama
- 💬 **AI Chat** - Ask questions about your screen time habits
- 🎨 **Enterprise UI** - Premium dark mode design with smooth animations
- 📈 **Multiple Charts** - Area charts, bar charts, and donut charts
- 🔄 **Live Updates** - Refresh data and insights on demand

## Tech Stack

### Frontend
- React 19
- Recharts for visualizations
- Tailwind CSS for styling
- Custom CSS design system

### Backend
- FastAPI (Python)
- Ollama for AI/LLM integration
- Async HTTP with httpx

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- [Ollama](https://ollama.ai/) installed locally

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Start Ollama

Make sure Ollama is running and you have a model pulled:

```bash
# Pull a model (if you haven't already)
ollama pull llama3.2

# Verify Ollama is running
curl http://localhost:11434/api/tags
```

### 3. Start the Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### 4. Start the Frontend

In a new terminal:

```bash
npm start
```

The app will open at `http://localhost:3000`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check API and Ollama status |
| `/api/daily` | GET | Get daily screen time data |
| `/api/apps` | GET | Get app usage breakdown |
| `/api/hourly` | GET | Get hourly usage distribution |
| `/api/categories` | GET | Get usage by category |
| `/api/summary` | GET | Get weekly summary stats |
| `/api/insights` | GET | Get AI-generated insights |
| `/api/chat` | POST | Chat with AI about screen time |
| `/api/dashboard` | GET | Get all dashboard data at once |

## Project Structure

```
screen-time-ui/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── services/
│       ├── data_service.py  # Mock data generation
│       └── ollama_service.py # Ollama AI integration
├── public/
│   └── index.html           # HTML template
├── src/
│   ├── App.js               # Main React component
│   ├── index.css            # Enterprise design system
│   ├── index.js             # React entry point
│   └── components/
│       ├── Sidebar.js       # Navigation sidebar
│       ├── KPICard.js       # KPI stat cards
│       ├── Charts.js        # Chart components
│       ├── InsightsPanel.js # AI insights display
│       └── AIChatPanel.js   # AI chat interface
├── package.json
└── README.md
```

## Configuration

### Using Different Ollama Models

You can use different models by passing the `model` parameter:

```bash
# Get insights with a specific model
curl "http://localhost:8000/api/insights?model=mistral"

# Chat with a specific model
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"question": "Why is my screen time high?", "model": "codellama"}'
```

### Connecting Real Data

Replace the mock data service in `backend/services/data_service.py` with your actual data source (database, AWS API, etc.).

## License

MIT
