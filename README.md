# Screenlytics Enterprise

> AI-Powered Workforce Focus Intelligence Platform

Screenlytics is the only on-premise focus intelligence platform built for teams, not just individuals. Understand your work patterns, optimize deep focus time, and improve team productivity—all while keeping your data private.

![Dashboard Preview](./docs/preview.png)

## Why Screenlytics?

Most productivity tools either sacrifice privacy for insights or provide generic advice without context. Screenlytics delivers personalized, actionable focus intelligence using local AI while ensuring your detailed activity data never leaves your device.

### Key Differentiators

- **🔒 Privacy-First**: All raw data stays local. Only anonymized metrics sync to your team.
- **🤖 Local AI**: Powered by Ollama—no cloud AI required, no data sent to third parties.
- **👥 Team Intelligence**: Anonymous team trends help managers identify meeting overload without surveillance.
- **⚡ Native Performance**: Built with Tauri (Rust) for minimal resource usage and maximum speed.

---

## Features

### 1. Real-Time Activity Tracking

Screenlytics automatically tracks your screen activity to build a complete picture of your work patterns.

**What it tracks:**
- Active window titles and application names
- Time spent per app and category (Development, Communication, Browsing, etc.)
- Context switches between apps
- Idle time detection

**Privacy note:** All tracking data is stored locally in SQLite. No data leaves your device unless you explicitly enable team sharing (and even then, only anonymized metrics are synced).

### 2. Focus Score & Deep Work Analysis

Get a quantitative measure of your daily focus quality.

**Focus Score Algorithm:**
```
FocusScore = (DeepWorkMinutes × 1.5 + FlowStateBlocks × 20)
             - (ContextSwitches × 2 + MeetingOverloadPenalty)
             normalized to 0-100
```

- **Deep Work Block**: 25+ minutes on a single category
- **Flow State**: 90+ minute uninterrupted block
- **Context Switch Penalty**: < 2 minutes between app switches
- **Meeting Overload**: > 4 hours in communication apps

### 3. AI Focus Coach (Ollama Integration)

Get personalized insights and recommendations from a local AI assistant.

**Features:**
- **Daily Briefing**: Automated analysis of your productivity with specific strengths and improvements
- **Conversational AI**: Ask questions like "Why was my focus score low yesterday?" or "When am I most productive?"
- **Context-Aware**: AI has access to your activity data for specific, actionable advice

**Setup:**
1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama3.2`
3. Start Ollama: `ollama serve`
4. Screenlytics automatically connects to `http://localhost:11434`

### 4. Focus Sessions (Pomodoro with App Blocking)

Structured deep work sessions with optional app blocking.

**How to use:**
1. Go to **Focus** tab
2. Select duration (25, 45, 60, or 90 minutes)
3. Configure apps to block (YouTube, Twitter, Reddit, etc.)
4. Click **Start Session**
5. Apps are blocked during the session; timer shows remaining time

**Features:**
- Configurable blocked app list
- Session history tracking
- Completion tracking for accountability

### 5. Team Intelligence (Privacy-Preserving)

Share anonymized focus trends with your team to improve collective productivity.

**How it works:**
1. Go to **Team** tab
2. Toggle "Share anonymized data"
3. Your device syncs only:
   - Focus scores (hashed identifier)
   - Category breakdowns (Development, Communication, etc.)
   - Deep work block counts

**What NEVER syncs:**
- App names or window titles
- URLs or document paths
- Hourly activity logs
- Any personally identifiable information

**Manager Dashboard:**
- Team average focus score
- Meeting overload alerts
- Fragmentation trends
- Anonymous comparison metrics

### 6. Calendar Integration

Correlate your focus data with calendar events to understand meeting impact.

**Supported Calendars:**
- Google Calendar (ICS export)
- Outlook
- Apple Calendar
- Any calendar with ICS feed support

**How to set up:**
1. Get your calendar's ICS/ICAL URL
2. Go to **Settings** → **Integrations**
3. Add ICS feed URL
4. View calendar events in **Timeline** tab alongside activity data

### 7. Work Item Tracking (JIRA/Linear)

Connect project management tools to see how focus time correlates with ticket progress.

**Supported Platforms:**
- JIRA Cloud
- Linear
- Asana (planned)

**Setup:**
1. Go to **Settings** → **Integrations**
2. Add API token for your platform
3. View assigned tickets in **Timeline** sidebar
4. Click through to view tickets directly

### 8. Enterprise Deployment

IT-managed deployment with configuration files.

**Configuration file locations:**
- **macOS/Linux**: `/etc/screenlytics/config.json`
- **Windows**: `C:\ProgramData\Screenlytics\config.json`

**Example `config.json`:**
```json
{
  "company_id": "acme-corp",
  "team_sync_endpoint": "https://internal.acme.com/screenlytics/sync",
  "ollama_endpoint": "http://ai.internal.acme.com:11434",
  "ollama_model": "llama3.2",
  "privacy_mode": "anonymized",
  "data_retention_days": 90,
  "disable_settings": true
}
```

**Configuration options:**

| Option | Description | Default |
|--------|-------------|---------|
| `company_id` | Company identifier for team sync | `null` |
| `team_sync_endpoint` | HTTPS endpoint for anonymized data | `null` |
| `ollama_endpoint` | Ollama instance URL | `http://localhost:11434` |
| `ollama_model` | LLM model to use | `llama3.2` |
| `privacy_mode` | `anonymized`, `full`, or `disabled` | `anonymized` |
| `data_retention_days` | Days to keep local data | `90` |
| `disable_settings` | Lock settings UI for managed mode | `false` |

---

## Getting Started

### Prerequisites

- **Node.js**: 20.x or later
- **Rust**: 1.70 or later
- **Ollama**: Optional, for AI features ([ollama.ai](https://ollama.ai))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/screenlytics.git
cd screenlytics

# Install frontend dependencies
npm install

# Install Tauri CLI (if not already installed)
cargo install tauri-cli

# Run in development mode
cargo tauri dev
```

### Building for Production

```bash
# Build release
npm run build
cargo tauri build
```

Output will be in `src-tauri/target/release/bundle/`.

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite |
| Desktop Framework | Tauri v2 (Rust) |
| Database | SQLite with sqlx |
| AI | Ollama (local LLM) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Animation | Framer Motion |

### Project Structure

```
screenlytics/
├── src/                          # React frontend
│   ├── app/
│   │   ├── App.tsx              # Main app shell with onboarding
│   │   └── store/               # Zustand state stores
│   ├── components/
│   │   ├── charts/              # Recharts components
│   │   ├── layout/              # Sidebar, Header
│   │   ├── onboarding/          # First-time user flow
│   │   └── ui/                  # Design system
│   ├── pages/                   # Route pages
│   │   ├── Dashboard.tsx        # KPIs, charts
│   │   ├── Timeline.tsx         # Activity + calendar
│   │   ├── FocusSession.tsx     # Timer + blocking
│   │   ├── Insights.tsx         # AI chat
│   │   ├── Team.tsx             # Privacy + sharing
│   │   └── Settings.tsx         # Preferences
│   └── services/                # Tauri bridge utilities
├── src-tauri/                   # Rust backend
│   └── src/
│       ├── main.rs              # App entry point
│       ├── db.rs                # SQLite operations
│       ├── tracker.rs           # OS activity tracking
│       ├── blocker.rs           # App/URL blocking
│       ├── ai.rs                # Ollama integration
│       ├── team.rs              # Team sync service
│       ├── integrations.rs      # Calendar + PM tools
│       ├── config.rs            # Enterprise config
│       └── commands.rs          # Tauri IPC commands
├── marketing/                   # Landing page
│   └── index.html
└── package.json
```

---

## Usage Guide

### Daily Workflow

**Morning:**
1. Open Screenlytics to see yesterday's focus score
2. Check AI insights for improvement suggestions
3. Review calendar for meeting-heavy days

**During Work:**
1. Start a Focus Session for deep work
2. Let tracking run in background
3. Switch contexts naturally—tracking is automatic

**End of Day:**
1. Review today's summary
2. Chat with AI about patterns
3. Toggle team sharing if you want to contribute to team analytics

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + 1` | Dashboard |
| `Cmd/Ctrl + 2` | Timeline |
| `Cmd/Ctrl + 3` | Focus Session |
| `Cmd/Ctrl + 4` | Insights |
| `Cmd/Ctrl + 5` | Team |
| `Cmd/Ctrl + ,` | Settings |

---

## Privacy & Security

### Data Storage

| Data Type | Storage | Encrypted | Synced |
|-----------|---------|-----------|--------|
| Window titles | Local SQLite | No | No |
| App names | Local SQLite | No | No |
| URLs/paths | Local SQLite | No | No |
| Hourly activity | Local SQLite | No | No |
| Focus scores | Local SQLite | No | Optional (anonymized) |
| Category totals | Local SQLite | No | Optional (anonymized) |

### Anonymization Process

When team sharing is enabled:
1. Employee ID is hashed (SHA-256) with a salt
2. Only category-level data is shared (not specific apps)
3. Data is aggregated before sync (daily totals, not hourly)
4. No URLs, window titles, or app names ever leave the device

### Enterprise Security

- No cloud storage or telemetry
- Configurable data retention (default: 90 days)
- SSO integration support (SAML 2.0)
- MDM deployment ready
- SOC 2 Type II ready architecture

---

## Troubleshooting

### Ollama Connection Issues

**Problem:** "AI service not available"

**Solution:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Pull a model
ollama pull llama3.2
```

### macOS Permissions

**Problem:** No window tracking data

**Solution:**
1. Open System Settings → Privacy & Security
2. Screen Recording → Enable Screenlytics
3. Accessibility → Enable Screenlytics
4. Restart the app

### Windows Admin Rights

**Problem:** Incomplete tracking on Windows

**Solution:** Run Screenlytics as Administrator for full window title access.

### Database Issues

**Reset local data:**
```bash
# macOS
rm ~/Library/Application\ Support/Screenlytics/screenlytics.db

# Windows
# Delete %APPDATA%\Screenlytics\screenlytics.db

# Linux
rm ~/.local/share/screenlytics/screenlytics.db
```

---

## API Reference

### Tauri Commands

The frontend communicates with Rust backend via these commands:

#### Activity
- `get_today_summary()` → DailySummary
- `get_hourly_data(date)` → HourlyData[]
- `get_app_breakdown(date)` → AppUsage[]
- `get_timeline(date)` → ActivityRecord[]

#### Focus
- `start_focus_session(duration, blockedApps)` → sessionId
- `stop_focus_session(wasCompleted)` → boolean
- `get_active_focus_session()` → FocusSession | null

#### AI
- `get_ai_insights()` → AIInsight
- `chat_with_ai(message)` → string

#### Team
- `get_team_summary()` → TeamSummary
- `toggle_team_sharing(enabled)` → boolean

#### Settings
- `get_settings()` → Settings
- `update_settings(changes)` → boolean
- `export_data(format, start, end)` → ActivityRecord[]
- `delete_data(olderThanDays)` → number

#### Integrations
- `get_calendar_events()` → CalendarEvent[]
- `get_work_items()` → WorkItem[]

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Install dependencies
npm install

# Run with hot reload
cargo tauri dev

# Run tests
npm test
cargo test
```

---

## License

MIT License - See [LICENSE](./LICENSE) for details.

---

## Support

- **Documentation**: [docs.screenlytics.com](https://docs.screenlytics.com)
- **Issues**: [GitHub Issues](https://github.com/screenlytics/enterprise/issues)
- **Enterprise Support**: enterprise@screenlytics.com
- **Community Discord**: [discord.gg/screenlytics](https://discord.gg/screenlytics)

---

## Roadmap

- [x] Phase 1: Core tracking + SQLite
- [x] Phase 2: Dashboard + design system
- [x] Phase 3: Ollama AI integration
- [x] Phase 4: Focus sessions + blocking
- [x] Phase 5: Team intelligence layer
- [x] Phase 6: Calendar + JIRA/Linear
- [x] Phase 7: Enterprise config + installers
- [x] Phase 8: Onboarding + marketing site
- [ ] Phase 9: Mobile companion app
- [ ] Phase 10: Advanced analytics + predictions

---

<p align="center">
  Built with ❤️ by the Screenlytics team
</p>
