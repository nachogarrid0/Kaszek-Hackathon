"""Handler for get_technical_indicators tool.

Hybrid: Finnhub aggregated signals + support/resistance + locally computed
RSI, SMA, MACD, Bollinger Bands, ATR from session price data.
"""
from __future__ import annotations

from data.finnhub import FinnhubClient
from config import settings
from store.memory import store
from engine.indicators import (
    calculate_rsi,
    calculate_sma,
    calculate_macd,
    calculate_bollinger_bands,
    calculate_atr,
)


async def handle_get_technical_indicators(input_data: dict, strategy_id: str) -> dict:
    symbol = input_data["symbol"]
    client = FinnhubClient(settings.finnhub_api_key)

    # Finnhub aggregated signals
    tech_scan = client.get_technical_indicators(symbol)
    support_resistance = client.get_support_resistance(symbol)

    # Locally computed indicators from session price data
    computed = {}
    session = store.get_session(strategy_id)
    price_data = None
    if session:
        price_data = session["data"].get("price_data", {}).get(symbol)

    if price_data and price_data.get("close"):
        closes = price_data["close"]
        highs = price_data["high"]
        lows = price_data["low"]
        current_price = closes[-1] if closes else None

        rsi = calculate_rsi(closes, 14)
        sma_50 = calculate_sma(closes, 50)
        sma_200 = calculate_sma(closes, 200)
        macd = calculate_macd(closes)
        bbands = calculate_bollinger_bands(closes, 20)
        atr = calculate_atr(highs, lows, closes, 14)

        computed = {
            "current_price": round(current_price, 2) if current_price else None,
            "rsi_14": round(rsi, 2) if rsi is not None else None,
            "sma_50": round(sma_50, 2) if sma_50 is not None else None,
            "sma_200": round(sma_200, 2) if sma_200 is not None else None,
            "price_vs_sma50": "above" if current_price and sma_50 and current_price > sma_50 else "below",
            "price_vs_sma200": "above" if current_price and sma_200 and current_price > sma_200 else "below",
            "macd": macd,
            "bollinger_bands": bbands,
            "atr_14": atr,
        }
    else:
        computed = {
            "error": f"No price data in session for {symbol}. Call get_price_history first."
        }

    # Format Finnhub aggregated signals
    aggregated = {}
    if isinstance(tech_scan, dict) and "technicalAnalysis" in tech_scan:
        ta = tech_scan["technicalAnalysis"]
        aggregated = {
            "signal": ta.get("signal", "neutral"),
            "count": ta.get("count", {}),
        }
        if "trend" in tech_scan:
            aggregated["trend_info"] = tech_scan["trend"]

    # Format support/resistance
    levels = {}
    if isinstance(support_resistance, dict) and "levels" in support_resistance:
        levels = {"levels": support_resistance["levels"]}

    store.update_session(strategy_id, {
        f"technicals_{symbol}": {
            "computed": computed,
            "aggregated": aggregated,
            "support_resistance": levels,
        }
    })

    return {
        "symbol": symbol,
        "computed_indicators": computed,
        "aggregated_signals": aggregated,
        "support_resistance": levels,
    }
