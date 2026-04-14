from __future__ import annotations

import os
import pandas as pd
import numpy as np
from pathlib import Path

DATA_DIR = Path(__file__).parent / "assets"

# Cache loaded data
_cache: dict[str, pd.DataFrame] = {}


def get_historical_data(symbol: str, period: str = "2y") -> pd.DataFrame | None:
    """Get historical OHLCV data for a symbol.

    First tries to load from CSV in data/assets/.
    If not available, generates realistic mock data.
    """
    cache_key = f"{symbol}_{period}"
    if cache_key in _cache:
        return _cache[cache_key]

    # Try loading from CSV
    csv_path = DATA_DIR / f"{symbol.replace('-', '_')}.csv"
    if csv_path.exists():
        df = pd.read_csv(csv_path, parse_dates=["date"], index_col="date")
        df.columns = [c.lower() for c in df.columns]
        df = _filter_period(df, period)
        _cache[cache_key] = df
        return df

    # Generate mock data
    df = _generate_mock_data(symbol, period)
    _cache[cache_key] = df
    return df


def _filter_period(df: pd.DataFrame, period: str) -> pd.DataFrame:
    periods_map = {"1y": 252, "2y": 504, "3y": 756, "5y": 1260}
    days = periods_map.get(period, 504)
    if len(df) > days:
        return df.iloc[-days:]
    return df


def _generate_mock_data(symbol: str, period: str) -> pd.DataFrame:
    """Generate realistic-looking mock OHLCV data."""
    np.random.seed(hash(symbol) % 2**31)

    periods_map = {"1y": 252, "2y": 504, "3y": 756, "5y": 1260}
    n_days = periods_map.get(period, 504)

    # Base prices and volatility by asset type
    profiles = {
        "AAPL": {"base": 150, "drift": 0.0008, "vol": 0.02},
        "MSFT": {"base": 300, "drift": 0.0009, "vol": 0.018},
        "NVDA": {"base": 200, "drift": 0.0015, "vol": 0.035},
        "GOOGL": {"base": 120, "drift": 0.0007, "vol": 0.022},
        "AMZN": {"base": 130, "drift": 0.0008, "vol": 0.025},
        "TSLA": {"base": 200, "drift": 0.0005, "vol": 0.04},
        "META": {"base": 250, "drift": 0.001, "vol": 0.03},
        "SPY": {"base": 420, "drift": 0.0004, "vol": 0.012},
        "QQQ": {"base": 350, "drift": 0.0006, "vol": 0.016},
        "ARKK": {"base": 40, "drift": -0.0002, "vol": 0.035},
        "BTC-USD": {"base": 30000, "drift": 0.001, "vol": 0.04},
        "ETH-USD": {"base": 2000, "drift": 0.0008, "vol": 0.045},
        "AMD": {"base": 100, "drift": 0.001, "vol": 0.03},
        "AVGO": {"base": 600, "drift": 0.001, "vol": 0.022},
        "CRM": {"base": 200, "drift": 0.0006, "vol": 0.025},
    }

    profile = profiles.get(symbol, {"base": 100, "drift": 0.0005, "vol": 0.025})
    base_price = profile["base"]
    drift = profile["drift"]
    vol = profile["vol"]

    # Generate price series with geometric Brownian motion
    dates = pd.bdate_range(end=pd.Timestamp("2024-12-31"), periods=n_days)
    returns = np.random.normal(drift, vol, n_days)

    # Add some regime changes / crashes for realism
    crash_start = int(n_days * 0.4)
    crash_end = crash_start + 30
    returns[crash_start:crash_end] = np.random.normal(-0.005, vol * 1.5, crash_end - crash_start)

    # Recovery
    recovery_end = crash_end + 60
    if recovery_end < n_days:
        returns[crash_end:recovery_end] = np.random.normal(0.003, vol * 1.2, recovery_end - crash_end)

    close_prices = base_price * np.exp(np.cumsum(returns))
    high_prices = close_prices * (1 + np.abs(np.random.normal(0, 0.008, n_days)))
    low_prices = close_prices * (1 - np.abs(np.random.normal(0, 0.008, n_days)))
    open_prices = np.roll(close_prices, 1) * (1 + np.random.normal(0, 0.003, n_days))
    open_prices[0] = base_price
    volume = np.random.lognormal(mean=15, sigma=0.5, size=n_days).astype(int)

    df = pd.DataFrame(
        {
            "open": np.round(open_prices, 2),
            "high": np.round(high_prices, 2),
            "low": np.round(low_prices, 2),
            "close": np.round(close_prices, 2),
            "volume": volume,
        },
        index=dates,
    )
    df.index.name = "date"
    return df
