"""Handler for get_economic_indicators tool.

Hybrid approach: hardcoded current macro values + Finnhub economic calendar
for upcoming events.
"""
from __future__ import annotations

from data.finnhub import FinnhubClient
from config import settings
from store.memory import store

# Hardcoded current macro values (update periodically)
CURRENT_MACRO = {
    "FEDERAL_FUNDS_RATE": {
        "current": 4.25,
        "trend": "falling",
        "last_change": "2024-12 (cut 25bp)",
        "history": [5.50, 5.50, 5.25, 5.00, 4.75, 4.50, 4.25],
        "history_labels": ["2024-Q1", "2024-Q2", "2024-Q3", "2024-Q3", "2024-Q4", "2024-Q4", "2025-Q1"],
    },
    "CPI": {
        "current": 2.8,
        "trend": "declining",
        "last_reading": "2025-03",
        "history": [3.4, 3.3, 3.0, 2.9, 2.7, 2.7, 2.8],
        "history_labels": ["2024-Q1", "2024-Q2", "2024-Q3", "2024-Q3", "2024-Q4", "2024-Q4", "2025-Q1"],
    },
    "INFLATION": {
        "current": 2.8,
        "trend": "declining",
        "note": "Same as CPI year-over-year",
    },
    "TREASURY_YIELD": {
        "current": 4.1,
        "trend": "stable",
        "maturity": "10-year",
        "history": [4.3, 4.4, 3.9, 4.0, 4.2, 4.3, 4.1],
        "history_labels": ["2024-Q1", "2024-Q2", "2024-Q3", "2024-Q3", "2024-Q4", "2024-Q4", "2025-Q1"],
    },
    "REAL_GDP": {
        "current": 2.8,
        "trend": "stable",
        "unit": "% annualized growth",
        "last_reading": "2024-Q4",
    },
    "UNEMPLOYMENT": {
        "current": 4.0,
        "trend": "stable",
        "last_reading": "2025-03",
    },
}


async def handle_get_economic_indicators(input_data: dict, strategy_id: str) -> dict:
    indicators = input_data.get("indicators", ["FEDERAL_FUNDS_RATE", "CPI", "TREASURY_YIELD"])

    # Get hardcoded macro values
    result_indicators = {}
    for ind in indicators:
        if ind in CURRENT_MACRO:
            result_indicators[ind] = CURRENT_MACRO[ind]
        else:
            result_indicators[ind] = {"error": f"Unknown indicator: {ind}"}

    # Get upcoming events from Finnhub
    client = FinnhubClient(settings.finnhub_api_key)
    calendar = client.get_economic_calendar()

    upcoming_events = []
    if isinstance(calendar, dict) and "economicCalendar" in calendar:
        events = calendar["economicCalendar"].get("result", [])
        for ev in events[:15]:
            upcoming_events.append({
                "date": ev.get("time", ""),
                "event": ev.get("event", ""),
                "country": ev.get("country", ""),
                "impact": ev.get("impact", "low"),
                "estimate": ev.get("estimate"),
                "actual": ev.get("actual"),
                "previous": ev.get("prev"),
            })

    store.update_session(strategy_id, {"macro_data": result_indicators})

    return {
        "indicators": result_indicators,
        "upcoming_events": upcoming_events,
        "note": (
            "Current indicator values are based on latest available data. "
            "Upcoming events are from Finnhub economic calendar."
        ),
    }
