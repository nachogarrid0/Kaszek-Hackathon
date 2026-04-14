from __future__ import annotations

from engine.benchmark import compare_with_benchmark
from store.memory import store


async def handle_compare_with_benchmark(input_data: dict, strategy_id: str) -> dict:
    result = compare_with_benchmark(
        strategy_equity=input_data["strategy_equity_curve"],
        strategy_dates=input_data["strategy_dates"],
        benchmark_symbol=input_data.get("benchmark", "SPY"),
    )

    store.update_session(strategy_id, {"benchmark_comparison": result})

    return result
