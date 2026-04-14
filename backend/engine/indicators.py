"""Local technical indicator calculations using numpy."""
from __future__ import annotations

import numpy as np


def calculate_sma(close: list[float] | np.ndarray, period: int) -> float | None:
    """Simple Moving Average — returns the latest value."""
    arr = np.array(close, dtype=float)
    if len(arr) < period:
        return None
    return float(np.mean(arr[-period:]))


def calculate_ema(close: list[float] | np.ndarray, period: int) -> float | None:
    """Exponential Moving Average — returns the latest value."""
    arr = np.array(close, dtype=float)
    if len(arr) < period:
        return None
    multiplier = 2 / (period + 1)
    ema = arr[0]
    for price in arr[1:]:
        ema = (price - ema) * multiplier + ema
    return float(ema)


def calculate_rsi(close: list[float] | np.ndarray, period: int = 14) -> float | None:
    """Relative Strength Index — returns the latest value (0-100)."""
    arr = np.array(close, dtype=float)
    if len(arr) < period + 1:
        return None
    deltas = np.diff(arr)
    gains = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)

    avg_gain = np.mean(gains[:period])
    avg_loss = np.mean(losses[:period])

    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return float(100 - 100 / (1 + rs))


def calculate_macd(
    close: list[float] | np.ndarray,
    fast: int = 12,
    slow: int = 26,
    signal: int = 9,
) -> dict | None:
    """MACD — returns {macd, signal, histogram, crossover}."""
    arr = np.array(close, dtype=float)
    if len(arr) < slow + signal:
        return None

    def _ema_series(data: np.ndarray, period: int) -> np.ndarray:
        result = np.empty_like(data)
        result[0] = data[0]
        mult = 2 / (period + 1)
        for i in range(1, len(data)):
            result[i] = (data[i] - result[i - 1]) * mult + result[i - 1]
        return result

    ema_fast = _ema_series(arr, fast)
    ema_slow = _ema_series(arr, slow)
    macd_line = ema_fast - ema_slow
    signal_line = _ema_series(macd_line[slow - 1:], signal)

    macd_val = float(macd_line[-1])
    signal_val = float(signal_line[-1])
    histogram = macd_val - signal_val

    # Crossover detection (last 2 bars)
    if len(macd_line) >= 2 and len(signal_line) >= 2:
        prev_macd = float(macd_line[-2])
        prev_signal = float(signal_line[-2])
        if prev_macd <= prev_signal and macd_val > signal_val:
            crossover = "bullish_crossover"
        elif prev_macd >= prev_signal and macd_val < signal_val:
            crossover = "bearish_crossover"
        else:
            crossover = "neutral"
    else:
        crossover = "neutral"

    return {
        "macd": round(macd_val, 4),
        "signal": round(signal_val, 4),
        "histogram": round(histogram, 4),
        "crossover": crossover,
    }


def calculate_bollinger_bands(
    close: list[float] | np.ndarray, period: int = 20, std_mult: float = 2.0
) -> dict | None:
    """Bollinger Bands — returns {upper, middle, lower, position}."""
    arr = np.array(close, dtype=float)
    if len(arr) < period:
        return None
    sma = float(np.mean(arr[-period:]))
    std = float(np.std(arr[-period:]))
    upper = sma + std_mult * std
    lower = sma - std_mult * std
    current = float(arr[-1])

    if current >= upper:
        position = "upper"
    elif current <= lower:
        position = "lower"
    else:
        position = "middle"

    return {
        "upper": round(upper, 2),
        "middle": round(sma, 2),
        "lower": round(lower, 2),
        "position": position,
    }


def calculate_atr(
    high: list[float] | np.ndarray,
    low: list[float] | np.ndarray,
    close: list[float] | np.ndarray,
    period: int = 14,
) -> float | None:
    """Average True Range — returns the latest value."""
    h = np.array(high, dtype=float)
    l = np.array(low, dtype=float)
    c = np.array(close, dtype=float)
    if len(h) < period + 1:
        return None

    tr = np.maximum(
        h[1:] - l[1:],
        np.maximum(
            np.abs(h[1:] - c[:-1]),
            np.abs(l[1:] - c[:-1]),
        ),
    )
    atr = float(np.mean(tr[-period:]))
    return round(atr, 4)
