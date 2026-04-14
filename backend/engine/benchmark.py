from __future__ import annotations

import pandas as pd

from data.mock_data import get_historical_data
from engine.metrics import calculate_metrics


def compare_with_benchmark(
    strategy_equity: list[float],
    strategy_dates: list[str],
    benchmark_symbol: str = "SPY",
) -> dict:
    """Compare strategy equity curve against a benchmark."""

    benchmark_df = get_historical_data(benchmark_symbol, "5y")
    if benchmark_df is None or benchmark_df.empty:
        return {"error": f"No data for benchmark {benchmark_symbol}"}

    # Align benchmark to strategy dates
    strategy_dates_dt = pd.to_datetime(strategy_dates)
    benchmark_df = benchmark_df[benchmark_df.index.isin(strategy_dates_dt)]

    if benchmark_df.empty:
        return {"error": "No overlapping dates with benchmark"}

    # Normalize benchmark to same starting value
    initial_value = strategy_equity[0] if strategy_equity else 10000
    benchmark_closes = benchmark_df["close"].values
    benchmark_equity = (benchmark_closes / benchmark_closes[0] * initial_value).tolist()
    benchmark_dates = [str(d.date()) for d in benchmark_df.index]

    # Calculate metrics for both
    strategy_metrics = calculate_metrics(strategy_equity)
    benchmark_metrics = calculate_metrics(benchmark_equity)

    return {
        "strategy": strategy_metrics,
        "benchmark": {
            "symbol": benchmark_symbol,
            "metrics": benchmark_metrics,
            "equity_curve": {
                "dates": benchmark_dates,
                "values": [round(v, 2) for v in benchmark_equity],
            },
        },
        "comparison": {
            "excess_return": round(
                strategy_metrics["total_return"] - benchmark_metrics["total_return"], 2
            ),
            "sharpe_diff": round(
                strategy_metrics["sharpe_ratio"] - benchmark_metrics["sharpe_ratio"], 2
            ),
            "beats_benchmark": strategy_metrics["total_return"] > benchmark_metrics["total_return"],
        },
    }
