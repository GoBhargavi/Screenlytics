# Changelog

All notable changes to Screenlytics Enterprise will be documented in this file.

## [1.0.0] - 2026-03-22

### Added
- Full Tauri v2 desktop application with React 19 + TypeScript frontend
- Real-time activity tracking with per-app time breakdown
- Focus session timer with configurable app blocking
- AI-powered insights and coaching via local Ollama integration
- Team intelligence layer with anonymized metric sharing
- Calendar integration (ICS) and work item tracking (JIRA/Linear)
- Onboarding flow with privacy-first messaging
- Enterprise configuration support for managed deployments
- SQLite-based local data storage with configurable retention
- Professional dark-themed UI with glassmorphism effects

### Fixed
- Replaced deprecated Tauri v1 API with v2 `Builder::setup()` pattern
- Split multi-statement SQLite migration into individual queries (sqlx compatibility)
- Fixed invalid `Cargo.toml` Linux dependencies (`std::process`, `std::time`)
- Fixed Tailwind CSS v4 directive mismatch (`@tailwind` → `@import`)
- Fixed Onboarding invoke argument mismatch (`changes` → `request`)
- Fixed `get_weekly_summary` returning duplicate today data instead of distinct dates
- Fixed `get_app_breakdown` ignoring date parameter
- Fixed `tauri.conf.json` property name typo
- Made Settings page fully editable (was read-only)
- Removed hardcoded Dashboard KPI trend values

### Removed
- Legacy Create React App `.js` files (App.js, Sidebar.js, Charts.js, etc.)
- Obsolete `postcss.config.js` and `tailwind.config.js` (not needed with Tailwind v4 Vite plugin)
- `package-lock.json` from `.gitignore` (needed for reproducible builds)
