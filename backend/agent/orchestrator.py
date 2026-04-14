from __future__ import annotations

import json
import uuid
from typing import AsyncGenerator

import anthropic

from config import settings
from agent.system_prompt import SYSTEM_PROMPT
from agent.tools import TOOLS
from agent.handlers import dispatch_tool
from store.memory import store


async def run_agent(thesis: str) -> AsyncGenerator[str, None]:
    """Run the autonomous agent loop. Yields SSE events."""

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    strategy_id = str(uuid.uuid4())[:8]

    store.create_session(strategy_id, thesis)

    messages = [{"role": "user", "content": thesis}]

    yield _sse("session_start", {"strategy_id": strategy_id})
    yield _sse("thinking", {"step": "Analizando tu tesis de inversión..."})

    max_iterations = 20
    for _ in range(max_iterations):
        response = client.messages.create(
            model=settings.model,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        assistant_content = response.content
        messages.append({"role": "assistant", "content": assistant_content})

        tool_results = []
        for block in assistant_content:
            if block.type == "text":
                yield _sse("chat_message", {"content": block.text})

            elif block.type == "tool_use":
                yield _sse("thinking", {
                    "step": _tool_thinking_message(block.name),
                })

                result = await dispatch_tool(block.name, block.input, strategy_id)

                if block.name == "update_dashboard":
                    yield _sse("dashboard_update", block.input)
                else:
                    dashboard_event = _tool_to_dashboard_event(block.name, result)
                    if dashboard_event:
                        yield _sse("dashboard_update", dashboard_event)

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result, default=str),
                })

        if tool_results:
            messages.append({"role": "user", "content": tool_results})
        else:
            break

        if response.stop_reason == "end_turn":
            break

    store.finalize_session(strategy_id)
    yield _sse("done", {"strategy_id": strategy_id})


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"


def _tool_thinking_message(tool_name: str) -> str:
    messages = {
        "identify_assets": "Identificando los activos más relevantes para tu tesis...",
        "get_historical_data": "Descargando datos históricos de mercado...",
        "run_backtest": "Ejecutando backtest de la estrategia...",
        "compare_with_benchmark": "Comparando contra el S&P 500...",
        "update_dashboard": "Actualizando el dashboard...",
    }
    return messages.get(tool_name, "Procesando...")


def _tool_to_dashboard_event(tool_name: str, result: dict) -> dict | None:
    if tool_name == "identify_assets":
        return {"type": "assets", "data": result}
    if tool_name == "run_backtest":
        return {"type": "metrics", "data": result}
    if tool_name == "compare_with_benchmark":
        return {"type": "benchmark", "data": result}
    return None
