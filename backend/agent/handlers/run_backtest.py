"""Handler for run_backtest tool.

Reads price data from session, delegates to the backtester engine.
"""
from __future__ import annotations

from engine.backtester import run_portfolio_backtest
from store.memory import store


async def handle_run_backtest(input_data: dict, strategy_id: str) -> dict:
    strategy = input_data["strategy"]
    initial_capital = input_data.get("initial_capital", 10000)
    period_years = input_data.get("period_years", 3)

    # Get price data from session
    session = store.get_session(strategy_id)
    if not session:
        return {"error": "No active session found"}

    price_data = session["data"].get("price_data", {})
    if not price_data:
        return {"error": "No price data loaded. Call get_price_history first."}

    result = run_portfolio_backtest(
        strategy=strategy,
        price_data=price_data,
        initial_capital=initial_capital,
        period_years=period_years,
    )

    store.update_session(strategy_id, {
        "last_backtest": result,
        "strategy_params": strategy,
    })

    return result
