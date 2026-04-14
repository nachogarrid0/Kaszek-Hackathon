"""Portfolio backtester with entry/exit rules, trailing stops, and regime analysis."""
from __future__ import annotations

import numpy as np
from datetime import datetime

from engine.indicators import calculate_rsi, calculate_sma, calculate_macd
from engine.metrics import calculate_metrics


def run_portfolio_backtest(
    strategy: dict,
    price_data: dict[str, dict],
    initial_capital: float = 10000,
    period_years: int = 3,
) -> dict:
    """Run a portfolio backtest with entry/exit rules.

    Args:
        strategy: {allocations, entry_rules, exit_rules, rebalance_frequency}
        price_data: {symbol: {dates, open, high, low, close, volume}}
        initial_capital: starting capital in USD
        period_years: how many years back to test
    """
    allocations = strategy.get("allocations", {})
    entry_rules = strategy.get("entry_rules", {})
    exit_rules = strategy.get("exit_rules", {})
    rebalance_freq = strategy.get("rebalance_frequency", "quarterly")

    if not allocations:
        return {"error": "No allocations specified"}

    # Normalize allocations to sum to 100
    total_alloc = sum(allocations.values())
    if total_alloc <= 0:
        return {"error": "Allocations must sum to > 0"}
    alloc_map = {k: v / total_alloc for k, v in allocations.items()}

    # Find common date range across all assets
    all_dates_sets = []
    for symbol in allocations:
        if symbol not in price_data:
            continue
        dates = price_data[symbol].get("dates", [])
        if dates:
            all_dates_sets.append(set(dates))

    if not all_dates_sets:
        return {"error": "No price data available for any of the specified assets"}

    common_dates = sorted(set.intersection(*all_dates_sets))
    if not common_dates:
        return {"error": "No overlapping dates between assets"}

    # Limit to period_years
    cutoff = len(common_dates) - (period_years * 252)
    if cutoff > 0:
        common_dates = common_dates[cutoff:]

    # Build aligned price arrays
    asset_closes = {}
    asset_highs = {}
    asset_lows = {}
    for symbol in allocations:
        if symbol not in price_data:
            continue
        pd_dates = price_data[symbol]["dates"]
        pd_close = price_data[symbol]["close"]
        pd_high = price_data[symbol]["high"]
        pd_low = price_data[symbol]["low"]
        date_to_idx = {d: i for i, d in enumerate(pd_dates)}
        closes = [pd_close[date_to_idx[d]] for d in common_dates if d in date_to_idx]
        highs = [pd_high[date_to_idx[d]] for d in common_dates if d in date_to_idx]
        lows = [pd_low[date_to_idx[d]] for d in common_dates if d in date_to_idx]
        if len(closes) == len(common_dates):
            asset_closes[symbol] = np.array(closes, dtype=float)
            asset_highs[symbol] = np.array(highs, dtype=float)
            asset_lows[symbol] = np.array(lows, dtype=float)

    if not asset_closes:
        return {"error": "Could not align price data for any assets"}

    n = len(common_dates)

    # Pre-compute indicators for entry/exit rules
    asset_rsi = {}
    asset_sma200 = {}
    asset_macd = {}
    for symbol, closes in asset_closes.items():
        asset_rsi[symbol] = _rolling_rsi(closes, 14)
        asset_sma200[symbol] = _rolling_sma(closes, 200)
        asset_macd[symbol] = _rolling_macd_signal(closes)

    # Exit rule params
    stop_loss_pct = exit_rules.get("stop_loss_pct", 100) / 100
    take_profit_pct = exit_rules.get("take_profit_pct", 1000) / 100
    trailing_stop_pct = exit_rules.get("trailing_stop_pct") or None
    if trailing_stop_pct:
        trailing_stop_pct = trailing_stop_pct / 100
    rsi_overbought = exit_rules.get("rsi_overbought", 100)

    # Entry rule params
    rsi_oversold = entry_rules.get("rsi_oversold", 100)
    require_above_sma200 = entry_rules.get("require_above_sma200", False)
    require_macd_crossover = entry_rules.get("macd_crossover", False)

    # Rebalance dates
    rebalance_dates = _get_rebalance_dates(common_dates, rebalance_freq)

    # Simulation
    cash = initial_capital
    positions = {}  # symbol -> {shares, entry_price, peak_price}
    equity_curve = []
    benchmark_curve = []

    # SPY benchmark
    spy_closes = asset_closes.get("SPY")
    spy_initial = spy_closes[0] if spy_closes is not None else None

    for i in range(n):
        date = common_dates[i]

        # Calculate current portfolio value
        portfolio_value = cash
        for sym, pos in positions.items():
            if sym in asset_closes:
                portfolio_value += pos["shares"] * asset_closes[sym][i]

        # Check exits for each position
        symbols_to_exit = []
        for sym, pos in list(positions.items()):
            if sym not in asset_closes:
                continue
            current_price = asset_closes[sym][i]
            pnl_pct = (current_price / pos["entry_price"]) - 1

            # Update peak for trailing stop
            pos["peak_price"] = max(pos["peak_price"], current_price)

            exit_reason = None
            if pnl_pct <= -stop_loss_pct:
                exit_reason = "stop_loss"
            elif pnl_pct >= take_profit_pct:
                exit_reason = "take_profit"
            elif trailing_stop_pct and (current_price / pos["peak_price"] - 1) <= -trailing_stop_pct:
                exit_reason = "trailing_stop"
            elif asset_rsi[sym][i] is not None and asset_rsi[sym][i] > rsi_overbought:
                exit_reason = "rsi_overbought"

            if exit_reason:
                symbols_to_exit.append(sym)

        # Execute exits
        for sym in symbols_to_exit:
            pos = positions.pop(sym)
            cash += pos["shares"] * asset_closes[sym][i]

        # Check entries / rebalance
        if date in rebalance_dates or i == 0:
            # Liquidate all for rebalance
            for sym in list(positions.keys()):
                pos = positions.pop(sym)
                cash += pos["shares"] * asset_closes[sym][i]

            # Re-enter based on rules
            for sym, alloc in alloc_map.items():
                if sym not in asset_closes:
                    continue

                # Check entry conditions
                can_enter = True
                if require_above_sma200 and asset_sma200[sym][i] is not None:
                    if asset_closes[sym][i] < asset_sma200[sym][i]:
                        can_enter = False
                if asset_rsi[sym][i] is not None and asset_rsi[sym][i] > rsi_oversold and rsi_oversold < 100:
                    # Only filter if rsi_oversold is set to something meaningful
                    pass  # RSI oversold is a "buy below" threshold, not a gate
                if require_macd_crossover and asset_macd[sym][i] != "bullish":
                    can_enter = False

                if can_enter:
                    capital_for_asset = portfolio_value * alloc
                    price = asset_closes[sym][i]
                    if price > 0:
                        shares = capital_for_asset / price
                        cash -= shares * price
                        positions[sym] = {
                            "shares": shares,
                            "entry_price": price,
                            "peak_price": price,
                        }

        # Record equity
        final_value = cash
        for sym, pos in positions.items():
            if sym in asset_closes:
                final_value += pos["shares"] * asset_closes[sym][i]

        equity_curve.append(round(final_value, 2))

        if spy_closes is not None and spy_initial and spy_initial > 0:
            benchmark_curve.append(
                round(initial_capital * (spy_closes[i] / spy_initial), 2)
            )

    # Calculate metrics
    metrics = calculate_metrics(equity_curve)

    # Monthly returns
    monthly_returns = _calculate_monthly_returns(common_dates, equity_curve)

    # Regime performance
    regime_perf = {}
    if spy_closes is not None:
        regime_perf = _calculate_regime_performance(
            common_dates, equity_curve, spy_closes
        )

    # Benchmark comparison
    benchmark_comp = {}
    if benchmark_curve:
        bm_metrics = calculate_metrics(benchmark_curve)
        benchmark_comp = {
            "spy_total_return_pct": bm_metrics["total_return"],
            "spy_sharpe": bm_metrics["sharpe_ratio"],
            "alpha_pct": round(metrics["total_return"] - bm_metrics["total_return"], 2),
            "beta": _calculate_beta(equity_curve, benchmark_curve),
        }

    # Build equity curve for frontend
    ec_data = []
    for i, date in enumerate(common_dates):
        point = {"date": date, "portfolio": equity_curve[i]}
        if i < len(benchmark_curve):
            point["benchmark"] = benchmark_curve[i]
        ec_data.append(point)

    return {
        "performance": {
            "total_return_pct": metrics["total_return"],
            "cagr_pct": metrics.get("cagr_pct", metrics["annualized_return"]),
            "max_drawdown_pct": metrics["max_drawdown"],
            "sharpe_ratio": metrics["sharpe_ratio"],
            "sortino_ratio": metrics["sortino_ratio"],
            "win_rate_pct": metrics["win_rate"],
            "profit_factor": metrics.get("profit_factor", 0),
            "best_month_pct": max((m["return_pct"] for m in monthly_returns), default=0),
            "worst_month_pct": min((m["return_pct"] for m in monthly_returns), default=0),
        },
        "benchmark_comparison": benchmark_comp,
        "regime_performance": regime_perf,
        "equity_curve": ec_data,
        "monthly_returns": monthly_returns,
        "period": {
            "start": common_dates[0],
            "end": common_dates[-1],
            "trading_days": n,
        },
    }


# ── Helpers ──

def _rolling_rsi(closes: np.ndarray, period: int = 14) -> list[float | None]:
    """Compute RSI for each bar."""
    result = [None] * len(closes)
    for i in range(period + 1, len(closes)):
        val = calculate_rsi(closes[: i + 1].tolist(), period)
        result[i] = val
    return result


def _rolling_sma(closes: np.ndarray, period: int) -> list[float | None]:
    result = [None] * len(closes)
    for i in range(period - 1, len(closes)):
        result[i] = float(np.mean(closes[i - period + 1: i + 1]))
    return result


def _rolling_macd_signal(closes: np.ndarray) -> list[str]:
    """Returns 'bullish', 'bearish', or 'neutral' per bar."""
    result = ["neutral"] * len(closes)
    for i in range(35, len(closes)):
        macd = calculate_macd(closes[: i + 1].tolist())
        if macd:
            result[i] = macd["crossover"].replace("_crossover", "") if "crossover" in macd["crossover"] else "neutral"
    return result


def _get_rebalance_dates(dates: list[str], frequency: str) -> set[str]:
    if frequency == "on_signal" or frequency == "none":
        return set()
    result = set()
    prev_period = None
    for date in dates:
        dt = datetime.strptime(date, "%Y-%m-%d")
        if frequency == "monthly":
            period = (dt.year, dt.month)
        elif frequency == "quarterly":
            period = (dt.year, (dt.month - 1) // 3)
        elif frequency == "yearly":
            period = dt.year
        else:
            continue
        if prev_period is not None and period != prev_period:
            result.add(date)
        prev_period = period
    return result


def _calculate_monthly_returns(dates: list[str], equity: list[float]) -> list[dict]:
    monthly = []
    prev_month = None
    month_start_value = equity[0]
    for i, date in enumerate(dates):
        month = date[:7]
        if prev_month and month != prev_month:
            ret = (equity[i - 1] / month_start_value - 1) * 100 if month_start_value > 0 else 0
            monthly.append({"month": prev_month, "return_pct": round(ret, 2)})
            month_start_value = equity[i - 1]
        prev_month = month
    if prev_month and month_start_value > 0:
        ret = (equity[-1] / month_start_value - 1) * 100
        monthly.append({"month": prev_month, "return_pct": round(ret, 2)})
    return monthly


def _calculate_regime_performance(
    dates: list[str], equity: list[float], spy_closes: np.ndarray
) -> dict:
    """Classify periods as bull/bear/sideways using SPY SMA200."""
    sma200 = _rolling_sma(spy_closes, 200)
    regimes = {"bull_market": [], "bear_market": [], "sideways": []}

    for i in range(1, len(dates)):
        daily_ret = (equity[i] / equity[i - 1] - 1) * 100 if equity[i - 1] > 0 else 0
        if sma200[i] is None:
            regimes["sideways"].append(daily_ret)
        elif spy_closes[i] > sma200[i] * 1.02:
            regimes["bull_market"].append(daily_ret)
        elif spy_closes[i] < sma200[i] * 0.98:
            regimes["bear_market"].append(daily_ret)
        else:
            regimes["sideways"].append(daily_ret)

    result = {}
    for regime, rets in regimes.items():
        if rets:
            cumulative = 1.0
            for r in rets:
                cumulative *= (1 + r / 100)
            result[regime] = {
                "return_pct": round((cumulative - 1) * 100, 2),
                "trading_days": len(rets),
            }
    return result


def _calculate_beta(strategy_equity: list[float], benchmark_equity: list[float]) -> float:
    if len(strategy_equity) < 2 or len(benchmark_equity) < 2:
        return 1.0
    s = np.array(strategy_equity)
    b = np.array(benchmark_equity)
    s_ret = np.diff(s) / s[:-1]
    b_ret = np.diff(b) / b[:-1]
    n = min(len(s_ret), len(b_ret))
    s_ret, b_ret = s_ret[:n], b_ret[:n]
    cov = np.cov(s_ret, b_ret)
    if cov[1, 1] == 0:
        return 1.0
    return round(float(cov[0, 1] / cov[1, 1]), 2)
