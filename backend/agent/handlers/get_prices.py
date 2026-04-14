"""Handler for get_price_history tool.

Fetches OHLCV from Finnhub and stores in session for backtester + technicals.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from data.finnhub import FinnhubClient
from config import settings
from store.memory import store


async def handle_get_price_history(input_data: dict, strategy_id: str) -> dict:
    symbol = input_data["symbol"]
    period_years = min(input_data.get("period_years", 3), 5)

    client = FinnhubClient(settings.finnhub_api_key)

    to_ts = int(datetime.now().timestamp())
    from_ts = int((datetime.now() - timedelta(days=365 * period_years)).timestamp())

    candles = client.get_stock_candles(symbol, "D", from_ts, to_ts)

    if isinstance(candles, dict) and candles.get("s") == "ok":
        dates = candles.get("t", [])
        opens = candles.get("o", [])
        highs = candles.get("h", [])
        lows = candles.get("l", [])
        closes = candles.get("c", [])
        volumes = candles.get("v", [])

        # Convert timestamps to date strings
        date_strs = [
            datetime.fromtimestamp(ts).strftime("%Y-%m-%d") for ts in dates
        ]

        price_data = {
            "dates": date_strs,
            "timestamps": dates,
            "open": opens,
            "high": highs,
            "low": lows,
            "close": closes,
            "volume": volumes,
        }

        # Store in session for backtester and technicals
        session = store.get_session(strategy_id)
        if session:
            existing = session["data"].get("price_data", {})
            existing[symbol] = price_data
            store.update_session(strategy_id, {"price_data": existing})

        n = len(closes)
        return {
            "symbol": symbol,
            "data_points": n,
            "start_date": date_strs[0] if date_strs else None,
            "end_date": date_strs[-1] if date_strs else None,
            "last_close": round(closes[-1], 2) if closes else None,
            "period_return_pct": round(
                (closes[-1] / closes[0] - 1) * 100, 2
            ) if closes and closes[0] > 0 else None,
            "highest": round(max(highs), 2) if highs else None,
            "lowest": round(min(lows), 2) if lows else None,
        }

    elif isinstance(candles, dict) and candles.get("s") == "no_data":
        return {"error": f"No price data available for {symbol}"}
    else:
        error_msg = candles.get("error", "Unknown error") if isinstance(candles, dict) else "Failed to fetch candles"
        return {"error": f"Failed to get price data for {symbol}: {error_msg}"}
