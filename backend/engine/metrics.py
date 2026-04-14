from __future__ import annotations

import numpy as np


def calculate_metrics(equity_curve: list[float], risk_free_rate: float = 0.04) -> dict:
    """Calculate portfolio performance metrics from an equity curve."""
    eq = np.array(equity_curve, dtype=float)
    if len(eq) < 2:
        return _empty_metrics()

    returns = np.diff(eq) / eq[:-1]
    total_return = (eq[-1] / eq[0] - 1) * 100
    annual_factor = 252 / len(returns) if len(returns) > 0 else 1
    annualized_return = ((1 + total_return / 100) ** annual_factor - 1) * 100

    # Sharpe ratio (annualized)
    if returns.std() > 0:
        daily_rf = (1 + risk_free_rate) ** (1 / 252) - 1
        sharpe = float(np.sqrt(252) * (returns.mean() - daily_rf) / returns.std())
    else:
        sharpe = 0.0

    # Sortino ratio
    downside = returns[returns < 0]
    if len(downside) > 0 and downside.std() > 0:
        sortino = float(np.sqrt(252) * returns.mean() / downside.std())
    else:
        sortino = 0.0

    # Max drawdown
    peak = np.maximum.accumulate(eq)
    drawdowns = (eq - peak) / peak * 100
    max_drawdown = float(drawdowns.min())

    # Win rate (daily)
    winning_days = int((returns > 0).sum())
    total_days = len(returns)
    win_rate = winning_days / total_days * 100 if total_days > 0 else 0

    # Volatility (annualized)
    volatility = float(returns.std() * np.sqrt(252) * 100)

    # CAGR
    years = total_days / 252
    if years > 0 and eq[0] > 0:
        cagr = ((eq[-1] / eq[0]) ** (1 / years) - 1) * 100
    else:
        cagr = 0.0

    # Profit factor (gross profits / gross losses)
    gains = returns[returns > 0]
    losses = returns[returns < 0]
    gross_profit = float(gains.sum()) if len(gains) > 0 else 0.0
    gross_loss = float(abs(losses.sum())) if len(losses) > 0 else 0.0
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else float("inf") if gross_profit > 0 else 0.0

    return {
        "total_return": round(total_return, 2),
        "annualized_return": round(annualized_return, 2),
        "cagr_pct": round(cagr, 2),
        "sharpe_ratio": round(sharpe, 2),
        "sortino_ratio": round(sortino, 2),
        "max_drawdown": round(max_drawdown, 2),
        "volatility": round(volatility, 2),
        "win_rate": round(win_rate, 1),
        "profit_factor": round(min(profit_factor, 99.0), 2),
        "total_days": total_days,
        "final_value": round(float(eq[-1]), 2),
    }


def _empty_metrics() -> dict:
    return {
        "total_return": 0,
        "annualized_return": 0,
        "cagr_pct": 0,
        "sharpe_ratio": 0,
        "sortino_ratio": 0,
        "max_drawdown": 0,
        "volatility": 0,
        "win_rate": 0,
        "profit_factor": 0,
        "total_days": 0,
        "final_value": 0,
    }
