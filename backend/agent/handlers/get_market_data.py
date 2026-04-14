from __future__ import annotations

from data.mock_data import get_historical_data
from store.memory import store


async def handle_get_historical_data(input_data: dict, strategy_id: str) -> dict:
    symbols = input_data["symbols"]
    period = input_data.get("period", "2y")

    results = {}
    errors = []

    for symbol in symbols:
        df = get_historical_data(symbol, period)
        if df is not None and not df.empty:
            results[symbol] = {
                "rows": len(df),
                "start_date": str(df.index[0].date()) if hasattr(df.index[0], "date") else str(df.index[0]),
                "end_date": str(df.index[-1].date()) if hasattr(df.index[-1], "date") else str(df.index[-1]),
                "last_close": round(float(df["close"].iloc[-1]), 2),
                "period_return": round(
                    float((df["close"].iloc[-1] / df["close"].iloc[0] - 1) * 100), 2
                ),
            }
        else:
            errors.append(symbol)

    store.update_session(strategy_id, {"market_data_loaded": list(results.keys())})

    return {
        "data_summary": results,
        "errors": errors,
        "note": "Datos cargados. Podés proceder a diseñar la estrategia y correr el backtest.",
    }
