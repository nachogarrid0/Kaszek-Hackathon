"""Handler for get_company_overview tool.

Combines Finnhub profile2 + basic_financials + recommendation_trends.
"""
from __future__ import annotations

from data.finnhub import FinnhubClient
from config import settings
from store.memory import store


async def handle_get_company_overview(input_data: dict, strategy_id: str) -> dict:
    symbol = input_data["symbol"]
    client = FinnhubClient(settings.finnhub_api_key)

    profile = client.get_company_profile(symbol)
    financials = client.get_basic_financials(symbol)
    recommendations = client.get_recommendation_trends(symbol)

    # Extract profile data
    company_info = {}
    if isinstance(profile, dict) and "error" not in profile:
        company_info = {
            "name": profile.get("name", symbol),
            "ticker": profile.get("ticker", symbol),
            "sector": profile.get("finnhubIndustry", "Unknown"),
            "country": profile.get("country", ""),
            "market_cap": profile.get("marketCapitalization"),
            "ipo_date": profile.get("ipo", ""),
            "exchange": profile.get("exchange", ""),
            "logo": profile.get("logo", ""),
            "web_url": profile.get("weburl", ""),
        }
    else:
        company_info = {"name": symbol, "ticker": symbol, "error": "Profile unavailable"}

    # Extract financial metrics
    metrics = {}
    if isinstance(financials, dict) and "metric" in financials:
        m = financials["metric"]
        metrics = {
            "pe_ratio": m.get("peBasicExclExtraTTM") or m.get("peTTM"),
            "pe_normalized": m.get("peNormalizedAnnual"),
            "pb_ratio": m.get("pbAnnual"),
            "ps_ratio": m.get("psAnnual"),
            "profit_margin": m.get("netProfitMarginTTM"),
            "operating_margin": m.get("operatingMarginTTM"),
            "gross_margin": m.get("grossMarginTTM"),
            "roe": m.get("roeTTM"),
            "roa": m.get("roaTTM"),
            "revenue_growth_3y": m.get("revenueGrowth3Y"),
            "revenue_growth_5y": m.get("revenueGrowth5Y"),
            "eps_growth_3y": m.get("epsGrowth3Y"),
            "eps_growth_5y": m.get("epsGrowth5Y"),
            "dividend_yield": m.get("dividendYieldIndicatedAnnual"),
            "beta": m.get("beta"),
            "52_week_high": m.get("52WeekHigh"),
            "52_week_low": m.get("52WeekLow"),
            "52_week_high_date": m.get("52WeekHighDate"),
            "52_week_low_date": m.get("52WeekLowDate"),
            "current_price": m.get("marketCapitalization"),
            "10_day_avg_volume": m.get("10DayAverageTradingVolume"),
        }
    else:
        metrics = {"error": "Financial metrics unavailable"}

    # Extract analyst recommendations
    analyst_data = {}
    if isinstance(recommendations, list) and len(recommendations) > 0:
        latest = recommendations[0]
        analyst_data = {
            "period": latest.get("period", ""),
            "strong_buy": latest.get("strongBuy", 0),
            "buy": latest.get("buy", 0),
            "hold": latest.get("hold", 0),
            "sell": latest.get("sell", 0),
            "strong_sell": latest.get("strongSell", 0),
        }
        total = sum([
            analyst_data["strong_buy"], analyst_data["buy"],
            analyst_data["hold"], analyst_data["sell"], analyst_data["strong_sell"],
        ])
        if total > 0:
            bullish_pct = (analyst_data["strong_buy"] + analyst_data["buy"]) / total * 100
            analyst_data["consensus"] = (
                "Strong Buy" if bullish_pct > 75
                else "Buy" if bullish_pct > 55
                else "Hold" if bullish_pct > 35
                else "Sell"
            )
            analyst_data["bullish_pct"] = round(bullish_pct, 1)
    else:
        analyst_data = {"error": "Analyst data unavailable"}

    store.update_session(strategy_id, {
        f"overview_{symbol}": {
            "profile": company_info,
            "metrics": metrics,
            "analysts": analyst_data,
        }
    })

    return {
        "symbol": symbol,
        "profile": company_info,
        "financial_metrics": metrics,
        "analyst_recommendations": analyst_data,
    }
