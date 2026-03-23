use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite, Row};
use chrono::{DateTime, Utc, NaiveDate, NaiveDateTime, Duration};
use serde::Serialize;
use anyhow::Result;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct ActivityRecord {
    pub id: i64,
    pub timestamp: DateTime<Utc>,
    pub app_name: String,
    pub window_title: String,
    pub category: String,
    pub duration_seconds: i64,
    pub is_idle: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct DailySummary {
    pub date: String,
    pub total_active_minutes: i64,
    pub total_idle_minutes: i64,
    pub context_switches: i64,
    pub deep_work_blocks: i64,
    pub focus_score: i32,
    pub top_apps: Vec<AppUsage>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AppUsage {
    pub app_name: String,
    pub category: String,
    pub total_minutes: i64,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct HourlyData {
    pub hour: i32,
    pub active_minutes: i64,
    pub idle_minutes: i64,
    pub context_switches: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct FocusSession {
    pub id: i64,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub duration_minutes: Option<i64>,
    pub was_completed: bool,
    pub blocked_apps: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Settings {
    pub tracking_enabled: bool,
    pub idle_threshold_seconds: i64,
    pub sampling_interval_seconds: i64,
    pub team_sharing_enabled: bool,
    pub anonymize_team_data: bool,
    pub data_retention_days: i64,
    pub ollama_enabled: bool,
    pub ollama_model: String,
    pub ollama_endpoint: String,
    pub onboarding_completed: bool,
}

#[derive(Clone)]
pub struct Database {
    pool: Pool<Sqlite>,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&format!("sqlite://{}", database_url))
            .await?;

        let db = Self { pool };
        db.migrate().await?;
        db.init_settings().await?;

        Ok(db)
    }

    async fn migrate(&self) -> Result<()> {
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                app_name TEXT NOT NULL,
                window_title TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'Uncategorized',
                duration_seconds INTEGER NOT NULL DEFAULT 0,
                is_idle BOOLEAN NOT NULL DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);
            CREATE INDEX IF NOT EXISTS idx_activities_app ON activities(app_name);

            CREATE TABLE IF NOT EXISTS focus_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time TEXT NOT NULL,
                end_time TEXT,
                duration_minutes INTEGER,
                was_completed BOOLEAN NOT NULL DEFAULT 0,
                blocked_apps TEXT
            );

            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                tracking_enabled BOOLEAN NOT NULL DEFAULT 1,
                idle_threshold_seconds INTEGER NOT NULL DEFAULT 300,
                sampling_interval_seconds INTEGER NOT NULL DEFAULT 5,
                team_sharing_enabled BOOLEAN NOT NULL DEFAULT 0,
                anonymize_team_data BOOLEAN NOT NULL DEFAULT 1,
                data_retention_days INTEGER NOT NULL DEFAULT 90,
                ollama_enabled BOOLEAN NOT NULL DEFAULT 1,
                ollama_model TEXT NOT NULL DEFAULT 'llama3.2',
                ollama_endpoint TEXT NOT NULL DEFAULT 'http://localhost:11434',
                onboarding_completed BOOLEAN NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS team_sync_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sync_date TEXT NOT NULL,
                data_hash TEXT NOT NULL,
                sync_status TEXT NOT NULL
            );
            "#,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    async fn init_settings(&self) -> Result<()> {
        sqlx::query(
            r#"
            INSERT OR IGNORE INTO settings (id) VALUES (1)
            "#,
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn insert_activity(&self, record: &ActivityRecord) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO activities (timestamp, app_name, window_title, category, duration_seconds, is_idle)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            "#,
        )
        .bind(record.timestamp.to_rfc3339())
        .bind(&record.app_name)
        .bind(&record.window_title)
        .bind(&record.category)
        .bind(record.duration_seconds)
        .bind(record.is_idle)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_today_summary(&self) -> Result<DailySummary> {
        let today = Utc::now().date_naive();
        let start = today.and_hms_opt(0, 0, 0).unwrap();
        let end = today.and_hms_opt(23, 59, 59).unwrap();

        let rows = sqlx::query(
            r#"
            SELECT app_name, category, SUM(duration_seconds) as total_seconds, COUNT(*) as count
            FROM activities
            WHERE timestamp >= ?1 AND timestamp <= ?2 AND is_idle = 0
            GROUP BY app_name
            ORDER BY total_seconds DESC
            "#,
        )
        .bind(start.format("%Y-%m-%dT%H:%M:%S").to_string())
        .bind(end.format("%Y-%m-%dT%H:%M:%S").to_string())
        .fetch_all(&self.pool)
        .await?;

        let mut total_active_seconds = 0i64;
        let mut top_apps = Vec::new();

        for row in &rows {
            let seconds: i64 = row.try_get("total_seconds")?;
            total_active_seconds += seconds;
        }

        for row in rows.iter().take(5) {
            let app_name: String = row.try_get("app_name")?;
            let category: String = row.try_get("category")?;
            let seconds: i64 = row.try_get("total_seconds")?;
            let minutes = seconds / 60;
            let percentage = if total_active_seconds > 0 {
                (seconds as f64 / total_active_seconds as f64) * 100.0
            } else {
                0.0
            };

            top_apps.push(AppUsage {
                app_name,
                category,
                total_minutes: minutes,
                percentage,
            });
        }

        let idle_row = sqlx::query(
            r#"
            SELECT SUM(duration_seconds) as idle_seconds
            FROM activities
            WHERE timestamp >= ?1 AND timestamp <= ?2 AND is_idle = 1
            "#,
        )
        .bind(start.format("%Y-%m-%dT%H:%M:%S").to_string())
        .bind(end.format("%Y-%m-%dT%H:%M:%S").to_string())
        .fetch_one(&self.pool)
        .await?;

        let idle_seconds: Option<i64> = idle_row.try_get("idle_seconds")?;
        let total_idle_minutes = idle_seconds.unwrap_or(0) / 60;

        let switches_row = sqlx::query(
            r#"
            SELECT COUNT(*) as switches
            FROM (
                SELECT app_name,
                       LAG(app_name) OVER (ORDER BY timestamp) as prev_app
                FROM activities
                WHERE timestamp >= ?1 AND timestamp <= ?2
            )
            WHERE app_name != prev_app AND prev_app IS NOT NULL
            "#,
        )
        .bind(start.format("%Y-%m-%dT%H:%M:%S").to_string())
        .bind(end.format("%Y-%m-%dT%H:%M:%S").to_string())
        .fetch_one(&self.pool)
        .await?;

        let context_switches: i64 = switches_row.try_get("switches")?;

        let focus_score = self.calculate_focus_score(
            total_active_seconds / 60,
            context_switches,
            top_apps.iter().map(|a| a.total_minutes).sum(),
        );

        let deep_work_blocks = self.count_deep_work_blocks(
            &start.format("%Y-%m-%dT%H:%M:%S").to_string(),
            &end.format("%Y-%m-%dT%H:%M:%S").to_string(),
        ).await?;

        Ok(DailySummary {
            date: today.to_string(),
            total_active_minutes: total_active_seconds / 60,
            total_idle_minutes,
            context_switches,
            deep_work_blocks,
            focus_score,
            top_apps,
        })
    }

    fn calculate_focus_score(&self, active_minutes: i64, context_switches: i64, deep_work: i64) -> i32 {
        let base_score = (active_minutes * 2).min(60);
        let switch_penalty = (context_switches * 3).min(30);
        let deep_bonus = (deep_work * 5).min(30);

        let score = base_score - switch_penalty + deep_bonus;
        score.clamp(0, 100) as i32
    }

    async fn count_deep_work_blocks(&self, start: &str, end: &str) -> Result<i64> {
        let rows = sqlx::query(
            r#"
            SELECT app_name, timestamp, duration_seconds
            FROM activities
            WHERE timestamp >= ?1 AND timestamp <= ?2 AND is_idle = 0
            ORDER BY timestamp
            "#,
        )
        .bind(start)
        .bind(end)
        .fetch_all(&self.pool)
        .await?;

        let mut blocks = 0i64;
        let mut current_block_app: Option<String> = None;
        let mut current_block_duration: i64 = 0;

        for row in &rows {
            let app_name: String = row.try_get("app_name")?;
            let duration: i64 = row.try_get("duration_seconds")?;

            if current_block_app.as_ref() == Some(&app_name) {
                current_block_duration += duration;
            } else {
                if current_block_duration >= 1500 {
                    blocks += 1;
                }
                current_block_app = Some(app_name);
                current_block_duration = duration;
            }
        }

        if current_block_duration >= 1500 {
            blocks += 1;
        }

        Ok(blocks)
    }

    pub async fn get_hourly_data(&self, date: NaiveDate) -> Result<Vec<HourlyData>> {
        let start = date.and_hms_opt(0, 0, 0).unwrap();
        let end = date.and_hms_opt(23, 59, 59).unwrap();

        let rows = sqlx::query(
            r#"
            SELECT 
                CAST(strftime('%H', timestamp) AS INTEGER) as hour,
                SUM(CASE WHEN is_idle = 0 THEN duration_seconds ELSE 0 END) as active_seconds,
                SUM(CASE WHEN is_idle = 1 THEN duration_seconds ELSE 0 END) as idle_seconds,
                COUNT(CASE WHEN app_name != LAG(app_name) OVER (ORDER BY timestamp) THEN 1 END) as switches
            FROM activities
            WHERE timestamp >= ?1 AND timestamp <= ?2
            GROUP BY hour
            ORDER BY hour
            "#,
        )
        .bind(start.format("%Y-%m-%dT%H:%M:%S").to_string())
        .bind(end.format("%Y-%m-%dT%H:%M:%S").to_string())
        .fetch_all(&self.pool)
        .await?;

        let mut hourly_map: HashMap<i32, HourlyData> = HashMap::new();

        for row in &rows {
            let hour: i32 = row.try_get("hour")?;
            let active_seconds: i64 = row.try_get("active_seconds")?;
            let idle_seconds: i64 = row.try_get("idle_seconds")?;
            let switches: i64 = row.try_get("switches")?;

            hourly_map.insert(
                hour,
                HourlyData {
                    hour,
                    active_minutes: active_seconds / 60,
                    idle_minutes: idle_seconds / 60,
                    context_switches: switches,
                },
            );
        }

        let mut result = Vec::new();
        for hour in 0..24 {
            result.push(hourly_map.get(&hour).cloned().unwrap_or(HourlyData {
                hour,
                active_minutes: 0,
                idle_minutes: 0,
                context_switches: 0,
            }));
        }

        Ok(result)
    }

    pub async fn get_category_breakdown(&self, date: NaiveDate) -> Result<Vec<(String, i64)>> {
        let start = date.and_hms_opt(0, 0, 0).unwrap();
        let end = date.and_hms_opt(23, 59, 59).unwrap();

        let rows = sqlx::query(
            r#"
            SELECT category, SUM(duration_seconds) as total_seconds
            FROM activities
            WHERE timestamp >= ?1 AND timestamp <= ?2 AND is_idle = 0
            GROUP BY category
            ORDER BY total_seconds DESC
            "#,
        )
        .bind(start.format("%Y-%m-%dT%H:%M:%S").to_string())
        .bind(end.format("%Y-%m-%dT%H:%M:%S").to_string())
        .fetch_all(&self.pool)
        .await?;

        let mut result = Vec::new();
        for row in rows {
            let category: String = row.try_get("category")?;
            let seconds: i64 = row.try_get("total_seconds")?;
            result.push((category, seconds / 60));
        }

        Ok(result)
    }

    pub async fn get_settings(&self) -> Result<Settings> {
        let row = sqlx::query(
            r#"
            SELECT * FROM settings WHERE id = 1
            "#,
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(Settings {
            tracking_enabled: row.try_get("tracking_enabled")?,
            idle_threshold_seconds: row.try_get("idle_threshold_seconds")?,
            sampling_interval_seconds: row.try_get("sampling_interval_seconds")?,
            team_sharing_enabled: row.try_get("team_sharing_enabled")?,
            anonymize_team_data: row.try_get("anonymize_team_data")?,
            data_retention_days: row.try_get("data_retention_days")?,
            ollama_enabled: row.try_get("ollama_enabled")?,
            ollama_model: row.try_get("ollama_model")?,
            ollama_endpoint: row.try_get("ollama_endpoint")?,
            onboarding_completed: row.try_get("onboarding_completed").unwrap_or(false),
        })
    }

    pub async fn update_settings(&self, settings: &Settings) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE settings SET
                tracking_enabled = ?1,
                idle_threshold_seconds = ?2,
                sampling_interval_seconds = ?3,
                team_sharing_enabled = ?4,
                anonymize_team_data = ?5,
                data_retention_days = ?6,
                ollama_enabled = ?7,
                ollama_model = ?8,
                ollama_endpoint = ?9,
                onboarding_completed = ?10
            WHERE id = 1
            "#,
        )
        .bind(settings.tracking_enabled)
        .bind(settings.idle_threshold_seconds)
        .bind(settings.sampling_interval_seconds)
        .bind(settings.team_sharing_enabled)
        .bind(settings.anonymize_team_data)
        .bind(settings.data_retention_days)
        .bind(settings.ollama_enabled)
        .bind(&settings.ollama_model)
        .bind(&settings.ollama_endpoint)
        .bind(settings.onboarding_completed)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn export_data(&self, start_date: &str, end_date: &str) -> Result<Vec<ActivityRecord>> {
        let rows = sqlx::query(
            r#"
            SELECT * FROM activities
            WHERE timestamp >= ?1 AND timestamp <= ?2
            ORDER BY timestamp
            "#,
        )
        .bind(start_date)
        .bind(end_date)
        .fetch_all(&self.pool)
        .await?;

        let mut records = Vec::new();
        for row in rows {
            let timestamp_str: String = row.try_get("timestamp")?;
            let timestamp = DateTime::parse_from_rfc3339(&timestamp_str)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now());

            records.push(ActivityRecord {
                id: row.try_get("id")?,
                timestamp,
                app_name: row.try_get("app_name")?,
                window_title: row.try_get("window_title")?,
                category: row.try_get("category")?,
                duration_seconds: row.try_get("duration_seconds")?,
                is_idle: row.try_get("is_idle")?,
            });
        }

        Ok(records)
    }

    pub async fn delete_old_data(&self, days: i64) -> Result<u64> {
        let cutoff = Utc::now() - Duration::days(days);

        let result = sqlx::query(
            r#"
            DELETE FROM activities WHERE timestamp < ?1
            "#,
        )
        .bind(cutoff.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected())
    }

    // Focus Session methods
    pub async fn start_focus_session(&self, blocked_apps: Vec<String>) -> Result<i64> {
        let apps_json = serde_json::to_string(&blocked_apps).unwrap_or_default();
        
        let result = sqlx::query(
            r#"
            INSERT INTO focus_sessions (start_time, blocked_apps)
            VALUES (?1, ?2)
            "#,
        )
        .bind(Utc::now().to_rfc3339())
        .bind(apps_json)
        .execute(&self.pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    pub async fn stop_focus_session(&self, session_id: i64, was_completed: bool) -> Result<()> {
        let session = sqlx::query(
            r#"
            SELECT start_time FROM focus_sessions WHERE id = ?1
            "#,
        )
        .bind(session_id)
        .fetch_one(&self.pool)
        .await?;

        let start_time_str: String = session.try_get("start_time")?;
        let start_time = DateTime::parse_from_rfc3339(&start_time_str)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now());

        let duration = Utc::now().signed_duration_since(start_time).num_minutes();

        sqlx::query(
            r#"
            UPDATE focus_sessions 
            SET end_time = ?1, duration_minutes = ?2, was_completed = ?3
            WHERE id = ?4
            "#,
        )
        .bind(Utc::now().to_rfc3339())
        .bind(duration)
        .bind(was_completed)
        .bind(session_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_active_focus_session(&self) -> Result<Option<FocusSession>> {
        let row = sqlx::query(
            r#"
            SELECT * FROM focus_sessions 
            WHERE end_time IS NULL 
            ORDER BY start_time DESC 
            LIMIT 1
            "#,
        )
        .fetch_optional(&self.pool)
        .await?;

        match row {
            Some(row) => {
                let start_time_str: String = row.try_get("start_time")?;
                let start_time = DateTime::parse_from_rfc3339(&start_time_str)
                    .map(|dt| dt.with_timezone(&Utc))
                    .unwrap_or_else(|_| Utc::now());

                let blocked_apps_json: String = row.try_get("blocked_apps")?;
                let blocked_apps: Vec<String> = serde_json::from_str(&blocked_apps_json).unwrap_or_default();

                Ok(Some(FocusSession {
                    id: row.try_get("id")?,
                    start_time,
                    end_time: None,
                    duration_minutes: None,
                    was_completed: row.try_get("was_completed")?,
                    blocked_apps,
                }))
            }
            None => Ok(None),
        }
    }

    pub async fn get_focus_session_history(&self, limit: i64) -> Result<Vec<FocusSession>> {
        let rows = sqlx::query(
            r#"
            SELECT * FROM focus_sessions 
            WHERE end_time IS NOT NULL
            ORDER BY start_time DESC 
            LIMIT ?1
            "#,
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        let mut sessions = Vec::new();
        for row in rows {
            let start_time_str: String = row.try_get("start_time")?;
            let start_time = DateTime::parse_from_rfc3339(&start_time_str)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now());

            let end_time_str: Option<String> = row.try_get("end_time")?;
            let end_time = end_time_str.and_then(|s| {
                DateTime::parse_from_rfc3339(&s)
                    .map(|dt| dt.with_timezone(&Utc))
                    .ok()
            });

            let blocked_apps_json: String = row.try_get("blocked_apps")?;
            let blocked_apps: Vec<String> = serde_json::from_str(&blocked_apps_json).unwrap_or_default();

            sessions.push(FocusSession {
                id: row.try_get("id")?,
                start_time,
                end_time,
                duration_minutes: row.try_get("duration_minutes")?,
                was_completed: row.try_get("was_completed")?,
                blocked_apps,
            });
        }

        Ok(sessions)
    }
}
