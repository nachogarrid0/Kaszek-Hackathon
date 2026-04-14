from __future__ import annotations

import json
import time
import logging
from datetime import datetime, timezone

from agent.handlers.get_indicators import handle_get_economic_indicators
from agent.handlers.get_overview import handle_get_company_overview
from agent.handlers.get_sentiment import handle_get_news_sentiment
from agent.handlers.get_prices import handle_get_price_history
from agent.handlers.get_technicals import handle_get_technical_indicators
from agent.handlers.run_backtest import handle_run_backtest
from agent.handlers.update_dashboard import handle_update_dashboard
from store.memory import store

logger = logging.getLogger(__name__)

HANDLER_MAP = {
    "get_economic_indicators": handle_get_economic_indicators,
    "get_company_overview": handle_get_company_overview,
    "get_news_sentiment": handle_get_news_sentiment,
    "get_price_history": handle_get_price_history,
    "get_technical_indicators": handle_get_technical_indicators,
    "run_backtest": handle_run_backtest,
    "update_dashboard": handle_update_dashboard,
}


def _safe_preview(data: dict, max_len: int = 200) -> str:
    """Create a safe preview of a dict for logging."""
    try:
        s = json.dumps(data, default=str, ensure_ascii=False)
        return s[:max_len] + ("..." if len(s) > max_len else "")
    except Exception:
        return str(data)[:max_len]


async def dispatch_tool(name: str, input_data: dict, strategy_id: str) -> dict:
    handler = HANDLER_MAP.get(name)
    if not handler:
        step = {
            "tool": name,
            "status": "error",
            "error": f"Unknown tool: {name}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "duration_ms": 0,
            "input_preview": _safe_preview(input_data),
            "result_preview": "",
        }
        store.add_session_step(strategy_id, step)
        logger.error(f"[TOOL] {name} | ERROR: Unknown tool")
        return {"error": f"Unknown tool: {name}"}

    ts = datetime.now(timezone.utc).isoformat()
    start = time.time()
    logger.info(f"[TOOL] {name} | START | input: {_safe_preview(input_data)}")

    try:
        result = await handler(input_data, strategy_id)
        elapsed_ms = int((time.time() - start) * 1000)
        ok = "error" not in result

        step = {
            "tool": name,
            "status": "ok" if ok else "error",
            "timestamp": ts,
            "duration_ms": elapsed_ms,
            "input_preview": _safe_preview(input_data),
            "result_preview": _safe_preview(result),
            "error": result.get("error") if not ok else None,
        }
        store.add_session_step(strategy_id, step)

        status = "OK" if ok else f"ERROR: {result.get('error', '?')}"
        logger.info(f"[TOOL] {name} | {status} | {elapsed_ms}ms | result: {_safe_preview(result, 100)}")
        return result

    except Exception as e:
        elapsed_ms = int((time.time() - start) * 1000)
        step = {
            "tool": name,
            "status": "error",
            "timestamp": ts,
            "duration_ms": elapsed_ms,
            "input_preview": _safe_preview(input_data),
            "result_preview": "",
            "error": str(e),
        }
        store.add_session_step(strategy_id, step)
        logger.exception(f"[TOOL] {name} | EXCEPTION | {elapsed_ms}ms | {e}")
        raise
