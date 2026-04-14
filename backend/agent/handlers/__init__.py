from __future__ import annotations

from agent.handlers.analyze_assets import handle_identify_assets
from agent.handlers.get_market_data import handle_get_historical_data
from agent.handlers.run_backtest import handle_run_backtest
from agent.handlers.build_strategy import handle_compare_with_benchmark
from agent.handlers.update_dashboard import handle_update_dashboard


HANDLER_MAP = {
    "identify_assets": handle_identify_assets,
    "get_historical_data": handle_get_historical_data,
    "run_backtest": handle_run_backtest,
    "compare_with_benchmark": handle_compare_with_benchmark,
    "update_dashboard": handle_update_dashboard,
}


async def dispatch_tool(name: str, input_data: dict, strategy_id: str) -> dict:
    handler = HANDLER_MAP.get(name)
    if not handler:
        return {"error": f"Unknown tool: {name}"}
    return await handler(input_data, strategy_id)
