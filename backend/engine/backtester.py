from __future__ import annotations

import numpy as np
import pandas as pd
from datetime import datetime

from data.mock_data import get_historical_data
from engine.metrics import calculate_metrics


def run_portfolio_backtest(
    assets: list[dict],
    initial_capital: float = 10000,
    stop_loss: float | None = None,
    take_profit: float | None = None,
    rebalance_frequency: str = "quarterly",
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict:
    """Run a portfolio-level backtest with allocation, stop-loss, take-profit, and rebalancing."""

    # Load data for each asset
    asset_data = {}
    for asset in assets:
        symbol = asset["symbol"]
        df = get_historical_data(symbol, "5y")
        if df is None or df.empty:
            continue

        if start_date:
            df = df[df.index >= pd.Timestamp(start_date)]
        if end_date:
            df = df[df.index <= pd.Timestamp(end_date)]

        if not df.empty:
            asset_data[symbol] = df

    if not asset_data:
        return {"error": "No data available for the specified assets"}

    # Align all dataframes to common dates
    common_dates = None
    for df in asset_data.values():
        if common_dates is None:
            common_dates = set(df.index)
        else:
            common_dates &= set(df.index)

    if not common_dates:
        return {"error": "No overlapping dates between assets"}

    common_dates = sorted(common_dates)

    # Build allocation map
    alloc_map = {}
    for asset in assets:
        if asset["symbol"] in asset_data:
            alloc_map[asset["symbol"]] = asset["allocation"] / 100.0

    # Normalize allocations
    total_alloc = sum(alloc_map.values())
    if total_alloc > 0:
        alloc_map = {k: v / total_alloc for k, v in alloc_map.items()}

    # Simulate portfolio
    equity_curve = []
    dates_list = []
    portfolio_value = initial_capital
    positions = {}  # symbol -> {"shares": float, "entry_price": float}

    # Determine rebalance dates
    rebalance_dates = _get_rebalance_dates(common_dates, rebalance_frequency)

    # Initial allocation
    for symbol, alloc in alloc_map.items():
        price = float(asset_data[symbol].loc[common_dates[0], "close"])
        capital_for_asset = initial_capital * alloc
        shares = capital_for_asset / price
        positions[symbol] = {"shares": shares, "entry_price": price}

    for date in common_dates:
        daily_value = 0.0
        stopped_out = []

        for symbol, pos in positions.items():
            price = float(asset_data[symbol].loc[date, "close"])
            position_value = pos["shares"] * price
            daily_value += position_value

            # Check stop-loss
            if stop_loss and pos["shares"] > 0:
                pnl_pct = (price / pos["entry_price"] - 1) * 100
                if pnl_pct <= -stop_loss:
                    stopped_out.append(symbol)

            # Check take-profit
            if take_profit and pos["shares"] > 0:
                pnl_pct = (price / pos["entry_price"] - 1) * 100
                if pnl_pct >= take_profit:
                    stopped_out.append(symbol)

        # Handle stop-loss / take-profit exits
        for symbol in stopped_out:
            if symbol in positions:
                price = float(asset_data[symbol].loc[date, "close"])
                cash_back = positions[symbol]["shares"] * price
                positions[symbol] = {"shares": 0, "entry_price": price}
                # Redistribute to remaining active positions
                active = [s for s in alloc_map if s not in stopped_out and positions.get(s, {}).get("shares", 0) > 0]
                if active:
                    per_asset = cash_back / len(active)
                    for s in active:
                        p = float(asset_data[s].loc[date, "close"])
                        positions[s]["shares"] += per_asset / p

        # Rebalance
        if date in rebalance_dates and daily_value > 0:
            for symbol, alloc in alloc_map.items():
                price = float(asset_data[symbol].loc[date, "close"])
                target_value = daily_value * alloc
                positions[symbol] = {
                    "shares": target_value / price,
                    "entry_price": price,
                }

        # Recalculate portfolio value after adjustments
        portfolio_value = sum(
            positions[s]["shares"] * float(asset_data[s].loc[date, "close"])
            for s in positions
            if positions[s]["shares"] > 0
        )

        equity_curve.append(round(portfolio_value, 2))
        dates_list.append(str(date.date()) if hasattr(date, "date") else str(date))

    # Calculate metrics
    metrics = calculate_metrics(equity_curve)
    metrics["initial_capital"] = initial_capital

    return {
        "metrics": metrics,
        "equity_curve": {
            "dates": dates_list,
            "values": equity_curve,
        },
        "assets_used": list(alloc_map.keys()),
        "period": {
            "start": dates_list[0] if dates_list else None,
            "end": dates_list[-1] if dates_list else None,
            "trading_days": len(dates_list),
        },
        "parameters": {
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "rebalance_frequency": rebalance_frequency,
        },
    }


def _get_rebalance_dates(dates: list, frequency: str) -> set:
    if frequency == "none":
        return set()

    rebalance = set()
    prev_period = None

    for date in dates:
        if frequency == "monthly":
            period = (date.year, date.month)
        elif frequency == "quarterly":
            period = (date.year, (date.month - 1) // 3)
        elif frequency == "yearly":
            period = date.year
        else:
            continue

        if prev_period is not None and period != prev_period:
            rebalance.add(date)
        prev_period = period

    return rebalance
