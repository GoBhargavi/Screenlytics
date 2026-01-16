"""
Mock data service for screen time analytics.
Replace with real data source (database, AWS API, etc.) in production.
"""

from datetime import datetime, timedelta
import random

# App categories for mock data
APP_CATEGORIES = {
    "Social Media": ["Instagram", "Twitter", "TikTok", "Facebook", "LinkedIn"],
    "Productivity": ["Slack", "Notion", "VS Code", "Terminal", "Figma"],
    "Entertainment": ["YouTube", "Netflix", "Spotify", "Twitch", "Disney+"],
    "Communication": ["Messages", "WhatsApp", "Discord", "Zoom", "Teams"],
    "Utilities": ["Safari", "Chrome", "Mail", "Calendar", "Notes"],
}


def generate_daily_data(days: int = 30) -> list[dict]:
    """Generate mock daily screen time data for the past N days."""
    data = []
    today = datetime.now()
    
    for i in range(days):
        date = today - timedelta(days=days - 1 - i)
        # Simulate realistic usage patterns (weekends have higher usage)
        is_weekend = date.weekday() >= 5
        base_minutes = random.randint(180, 320) if is_weekend else random.randint(120, 240)
        
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "total_minutes": base_minutes,
            "day_of_week": date.strftime("%A"),
            "is_weekend": is_weekend,
        })
    
    return data


def generate_app_usage() -> list[dict]:
    """Generate mock app usage breakdown."""
    apps = []
    
    for category, app_list in APP_CATEGORIES.items():
        for app in app_list[:3]:  # Top 3 apps per category
            apps.append({
                "app_name": app,
                "category": category,
                "minutes": random.randint(15, 120),
                "sessions": random.randint(3, 25),
            })
    
    # Sort by minutes descending
    apps.sort(key=lambda x: x["minutes"], reverse=True)
    return apps[:10]  # Return top 10


def generate_hourly_distribution() -> list[dict]:
    """Generate hourly usage distribution for today."""
    distribution = []
    
    for hour in range(24):
        # Simulate realistic hourly patterns
        if 0 <= hour < 7:
            minutes = random.randint(0, 5)
        elif 7 <= hour < 9:
            minutes = random.randint(10, 30)
        elif 9 <= hour < 12:
            minutes = random.randint(20, 45)
        elif 12 <= hour < 14:
            minutes = random.randint(15, 35)
        elif 14 <= hour < 18:
            minutes = random.randint(25, 50)
        elif 18 <= hour < 22:
            minutes = random.randint(30, 55)
        else:
            minutes = random.randint(5, 20)
        
        distribution.append({
            "hour": hour,
            "hour_label": f"{hour:02d}:00",
            "minutes": minutes,
        })
    
    return distribution


def generate_category_breakdown() -> list[dict]:
    """Generate usage breakdown by category."""
    categories = []
    total = 0
    
    for category in APP_CATEGORIES.keys():
        minutes = random.randint(30, 150)
        total += minutes
        categories.append({
            "category": category,
            "minutes": minutes,
            "color": get_category_color(category),
        })
    
    # Add percentage
    for cat in categories:
        cat["percentage"] = round((cat["minutes"] / total) * 100, 1)
    
    return sorted(categories, key=lambda x: x["minutes"], reverse=True)


def get_category_color(category: str) -> str:
    """Get color for each category."""
    colors = {
        "Social Media": "#8B5CF6",
        "Productivity": "#10B981",
        "Entertainment": "#F59E0B",
        "Communication": "#3B82F6",
        "Utilities": "#6B7280",
    }
    return colors.get(category, "#6B7280")


def get_weekly_summary() -> dict:
    """Generate weekly summary statistics."""
    daily_data = generate_daily_data(7)
    total_minutes = sum(d["total_minutes"] for d in daily_data)
    
    return {
        "total_minutes": total_minutes,
        "total_hours": round(total_minutes / 60, 1),
        "daily_average": round(total_minutes / 7),
        "peak_day": max(daily_data, key=lambda x: x["total_minutes"]),
        "lowest_day": min(daily_data, key=lambda x: x["total_minutes"]),
        "trend": "up" if daily_data[-1]["total_minutes"] > daily_data[0]["total_minutes"] else "down",
        "trend_percentage": abs(round(
            ((daily_data[-1]["total_minutes"] - daily_data[0]["total_minutes"]) / 
             daily_data[0]["total_minutes"]) * 100, 1
        )),
    }


def get_all_data() -> dict:
    """Get all screen time data for AI context."""
    return {
        "daily": generate_daily_data(30),
        "apps": generate_app_usage(),
        "hourly": generate_hourly_distribution(),
        "categories": generate_category_breakdown(),
        "summary": get_weekly_summary(),
    }
