from __future__ import annotations

from engine.backtester import run_portfolio_backtest
from store.memory import store


async def handle_run_backtest(input_data: dict, strategy_id: str) -> dict:
    result = run_portfolio_backtest(
        assets=input_data["assets"],
        initial_capital=input_data.get("initial_capital", 10000),
        stop_loss=input_data.get("stop_loss"),
        take_profit=input_data.get("take_profit"),
        rebalance_frequency=input_data.get("rebalance_frequency", "quarterly"),
        start_date=input_data.get("start_date"),
        end_date=input_data.get("end_date"),
    )

    store.update_session(strategy_id, {
        "last_backtest": result,
        "strategy_params": {
            "assets": input_data["assets"],
            "stop_loss": input_data.get("stop_loss"),
            "take_profit": input_data.get("take_profit"),
            "rebalance_frequency": input_data.get("rebalance_frequency"),
        },
    })

    return result
