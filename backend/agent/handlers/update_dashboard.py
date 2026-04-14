from __future__ import annotations

from store.memory import store


async def handle_update_dashboard(input_data: dict, strategy_id: str) -> dict:
    update_type = input_data.get("type", "unknown")
    data = input_data.get("data", {})

    store.update_session(strategy_id, {f"dashboard_{update_type}": data})

    return {"status": "ok", "type": update_type}
