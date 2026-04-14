from __future__ import annotations

import time
import httpx
from datetime import datetime, timedelta


class FinnhubClient:
    """Finnhub API client with rate limiting (60 calls/min free tier)."""

    BASE_URL = "https://finnhub.io/api/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self._call_timestamps: list[float] = []
        self._client = httpx.Client(timeout=15.0)

    def _throttle(self):
        """Simple rate limiter: max 55 calls per 60 seconds (5 call buffer)."""
        now = time.time()
        self._call_timestamps = [t for t in self._call_timestamps if now - t < 60]
        if len(self._call_timestamps) >= 55:
            wait = 60 - (now - self._call_timestamps[0]) + 0.5
            if wait > 0:
                time.sleep(wait)
        self._call_timestamps.append(time.time())

    def _get(self, endpoint: str, params: dict | None = None) -> dict | list:
        self._throttle()
        p = {"token": self.api_key}
        if params:
            p.update(params)
        try:
            resp = self._client.get(f"{self.BASE_URL}{endpoint}", params=p)
            if resp.status_code == 429:
                return {"error": "Finnhub rate limit exceeded. Waiting..."}
            if resp.status_code == 403:
                return {"error": "Finnhub API: premium endpoint or invalid key"}
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            return {"error": f"Finnhub HTTP {e.response.status_code}: {e.response.text[:200]}"}
        except Exception as e:
            return {"error": f"Finnhub request failed: {str(e)[:200]}"}

    # ── Company Fundamentals ──

    def get_company_profile(self, symbol: str) -> dict:
        """GET /stock/profile2 — company name, sector, market cap, etc."""
        return self._get("/stock/profile2", {"symbol": symbol})

    def get_basic_financials(self, symbol: str) -> dict:
        """GET /stock/metric — PE, margins, growth, ratios."""
        return self._get("/stock/metric", {"symbol": symbol, "metric": "all"})

    def get_recommendation_trends(self, symbol: str) -> list | dict:
        """GET /stock/recommendation — analyst buy/hold/sell consensus."""
        return self._get("/stock/recommendation", {"symbol": symbol})

    # ── Stock Prices ──

    def get_stock_candles(
        self,
        symbol: str,
        resolution: str = "D",
        from_ts: int | None = None,
        to_ts: int | None = None,
    ) -> dict:
        """GET /stock/candle — OHLCV data.
        resolution: 1, 5, 15, 30, 60, D, W, M
        """
        if to_ts is None:
            to_ts = int(datetime.now().timestamp())
        if from_ts is None:
            from_ts = int((datetime.now() - timedelta(days=365 * 3)).timestamp())

        return self._get("/stock/candle", {
            "symbol": symbol,
            "resolution": resolution,
            "from": from_ts,
            "to": to_ts,
        })

    # ── News ──

    def get_company_news(
        self,
        symbol: str,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> list | dict:
        """GET /company-news — recent news articles for a company."""
        if to_date is None:
            to_date = datetime.now().strftime("%Y-%m-%d")
        if from_date is None:
            from_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

        return self._get("/company-news", {
            "symbol": symbol,
            "from": from_date,
            "to": to_date,
        })

    # ── Technical Analysis ──

    def get_technical_indicators(self, symbol: str, resolution: str = "D") -> dict:
        """GET /scan/technical-indicator — aggregate buy/sell/neutral signals."""
        return self._get("/scan/technical-indicator", {
            "symbol": symbol,
            "resolution": resolution,
        })

    def get_support_resistance(self, symbol: str, resolution: str = "D") -> dict:
        """GET /scan/support-resistance — key price levels."""
        return self._get("/scan/support-resistance", {
            "symbol": symbol,
            "resolution": resolution,
        })

    # ── Economic ──

    def get_economic_calendar(
        self,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> dict:
        """GET /calendar/economic — upcoming macro events."""
        if to_date is None:
            to_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        if from_date is None:
            from_date = datetime.now().strftime("%Y-%m-%d")

        return self._get("/calendar/economic", {
            "from": from_date,
            "to": to_date,
        })
