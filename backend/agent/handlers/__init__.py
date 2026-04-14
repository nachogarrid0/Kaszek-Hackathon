from __future__ import annotations

from agent.handlers.get_indicators import handle_get_economic_indicators
from agent.handlers.get_overview import handle_get_company_overview
from agent.handlers.get_sentiment import handle_get_news_sentiment
from agent.handlers.get_prices import handle_get_price_history
from agent.handlers.get_technicals import handle_get_technical_indicators
from agent.handlers.run_backtest import handle_run_backtest
from agent.handlers.update_dashboard import handle_update_dashboard


HANDLER_MAP = {
    "get_economic_indicators": handle_get_economic_indicators,
    "get_company_overview": handle_get_company_overview,
    "get_news_sentiment": handle_get_news_sentiment,
    "get_price_history": handle_get_price_history,
    "get_technical_indicators": handle_get_technical_indicators,
    "run_backtest": handle_run_backtest,
    "update_dashboard": handle_update_dashboard,
}


async def dispatch_tool(name: str, input_data: dict, strategy_id: str) -> dict:
    handler = HANDLER_MAP.get(name)
    if not handler:
        return {"error": f"Unknown tool: {name}"}
    return await handler(input_data, strategy_id)
