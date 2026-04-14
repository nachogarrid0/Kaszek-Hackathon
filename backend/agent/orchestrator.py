"""Autonomous agent orchestrator with real-time streaming.

Inspired by StratMind's ia_anthropic/agent.py pattern:
- Streams text tokens as they arrive (not after full response)
- Emits granular events: status, tool_call, tool_result, text_delta, thinking
- User sees every step of the agent's reasoning in real time
"""
from __future__ import annotations

import json
import uuid
import logging
from typing import AsyncGenerator

import anthropic

from config import settings
from agent.system_prompt import SYSTEM_PROMPT
from agent.tools import TOOLS
from agent.handlers import dispatch_tool
from store.memory import store

logger = logging.getLogger(__name__)

MAX_ITERATIONS = 30
MAX_TOKENS = 8192


async def run_agent(thesis: str) -> AsyncGenerator[str, None]:
    """Run the autonomous agent loop with streaming. Yields SSE events."""

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    strategy_id = str(uuid.uuid4())[:8]

    store.create_session(strategy_id, thesis)
    messages = [{"role": "user", "content": thesis}]

    yield _sse("session_start", {"strategy_id": strategy_id})
    yield _sse("status", {"message": "Conectando con Claude..."})

    usage_totals = {"input_tokens": 0, "output_tokens": 0}
    total_tool_calls = 0

    for iteration in range(MAX_ITERATIONS):
        # ── Stream the response token by token ──
        text_buffer = ""
        tool_use_blocks = []
        stop_reason = None

        try:
            with client.messages.stream(
                model=settings.model,
                max_tokens=MAX_TOKENS,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=messages,
            ) as stream:

                current_tool_input = ""
                current_tool_name = ""
                current_tool_id = ""
                in_tool_input = False

                for event in stream:
                    # ── Content block start ──
                    if event.type == "content_block_start":
                        block = event.content_block
                        if block.type == "text":
                            text_buffer = ""
                        elif block.type == "tool_use":
                            current_tool_name = block.name
                            current_tool_id = block.id
                            current_tool_input = ""
                            in_tool_input = True
                            total_tool_calls += 1

                            yield _sse("tool_start", {
                                "tool": block.name,
                                "message": _tool_thinking_message(block.name),
                            })

                    # ── Content block delta (streaming text/input) ──
                    elif event.type == "content_block_delta":
                        delta = event.delta
                        if delta.type == "text_delta":
                            text_buffer += delta.text
                            yield _sse("text_delta", {"content": delta.text})

                        elif delta.type == "input_json_delta":
                            if in_tool_input:
                                current_tool_input += delta.partial_json

                    # ── Content block stop ──
                    elif event.type == "content_block_stop":
                        if in_tool_input:
                            # Parse tool input and store the block
                            try:
                                parsed_input = json.loads(current_tool_input) if current_tool_input else {}
                            except json.JSONDecodeError:
                                parsed_input = {}

                            tool_use_blocks.append({
                                "id": current_tool_id,
                                "name": current_tool_name,
                                "input": parsed_input,
                            })
                            in_tool_input = False

                        elif text_buffer.strip():
                            # Text block finished — emit as complete message
                            yield _sse("chat_message", {"content": text_buffer.strip()})
                            text_buffer = ""

                    # ── Message stop ──
                    elif event.type == "message_stop":
                        pass

                # Get the final message for messages array
                final_message = stream.get_final_message()
                stop_reason = final_message.stop_reason

                # Accumulate usage
                if final_message.usage:
                    usage_totals["input_tokens"] += final_message.usage.input_tokens
                    usage_totals["output_tokens"] += final_message.usage.output_tokens

                yield _sse("usage", usage_totals)

        except anthropic.APIError as e:
            yield _sse("error", {"message": f"Error de API: {e.message}"})
            break
        except Exception as e:
            yield _sse("error", {"message": f"Error inesperado: {str(e)}"})
            logger.exception("Agent loop error")
            break

        # ── Append assistant message to history ──
        messages.append({"role": "assistant", "content": final_message.content})

        # ── Check if agent is done ──
        if stop_reason == "end_turn":
            break

        # ── Handle max_tokens truncation ──
        if stop_reason == "max_tokens":
            messages.append({
                "role": "user",
                "content": "Tu respuesta fue truncada. Continua donde te quedaste.",
            })
            continue

        # ── Execute tool calls ──
        if not tool_use_blocks:
            break

        tool_results = []
        for tool_block in tool_use_blocks:
            tool_name = tool_block["name"]
            tool_input = tool_block["input"]
            tool_id = tool_block["id"]

            yield _sse("tool_executing", {
                "tool": tool_name,
                "input_preview": _tool_input_preview(tool_name, tool_input),
            })

            try:
                result = await dispatch_tool(tool_name, tool_input, strategy_id)
                ok = True
            except Exception as e:
                result = {"error": str(e)}
                ok = False
                logger.exception("Tool %s failed", tool_name)

            # Emit tool result event
            yield _sse("tool_result", {
                "tool": tool_name,
                "ok": ok,
                "preview": _tool_result_preview(tool_name, result),
            })

            # Forward dashboard updates to frontend
            if tool_name == "update_dashboard":
                yield _sse("dashboard_update", {
                    "type": tool_input.get("type"),
                    "data": tool_input.get("data", {}),
                })
            else:
                dashboard_event = _tool_to_dashboard_event(tool_name, result)
                if dashboard_event:
                    yield _sse("dashboard_update", dashboard_event)

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_id,
                "content": json.dumps(result, default=str, ensure_ascii=False),
            })

        # Send tool results back to Claude
        messages.append({"role": "user", "content": tool_results})

    else:
        yield _sse("chat_message", {
            "content": "He alcanzado el limite maximo de iteraciones. Presentando los mejores resultados obtenidos.",
        })

    store.finalize_session(strategy_id)

    yield _sse("done", {
        "strategy_id": strategy_id,
        "usage": usage_totals,
        "tool_calls": total_tool_calls,
    })


# ── SSE Formatting ──

def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str, ensure_ascii=False)}\n\n"


# ── Tool Display Helpers ──

def _tool_thinking_message(tool_name: str) -> str:
    return {
        "get_economic_indicators": "Analizando el contexto macroeconomico...",
        "get_company_overview": "Evaluando los fundamentales de la empresa...",
        "get_news_sentiment": "Analizando noticias y sentimiento del mercado...",
        "get_price_history": "Descargando datos historicos de precios...",
        "get_technical_indicators": "Calculando indicadores tecnicos...",
        "run_backtest": "Ejecutando backtest de la estrategia...",
        "update_dashboard": "Actualizando el dashboard...",
    }.get(tool_name, "Procesando...")


def _tool_input_preview(tool_name: str, tool_input: dict) -> str:
    """Short preview of what the tool is being called with."""
    if tool_name == "get_company_overview":
        return f"Empresa: {tool_input.get('symbol', '?')}"
    if tool_name == "get_price_history":
        return f"{tool_input.get('symbol', '?')} — {tool_input.get('period_years', 3)} anos"
    if tool_name == "get_technical_indicators":
        return f"Indicadores para {tool_input.get('symbol', '?')}"
    if tool_name == "get_news_sentiment":
        return f"Noticias de {tool_input.get('tickers', '?')}"
    if tool_name == "get_economic_indicators":
        inds = tool_input.get("indicators", [])
        return f"Indicadores: {', '.join(inds[:3])}"
    if tool_name == "run_backtest":
        allocs = tool_input.get("strategy", {}).get("allocations", {})
        return f"Portfolio: {', '.join(f'{k} {v}%' for k, v in list(allocs.items())[:4])}"
    if tool_name == "update_dashboard":
        return f"Seccion: {tool_input.get('type', '?')}"
    return ""


def _tool_result_preview(tool_name: str, result: dict) -> str:
    """Short preview of the tool result for the user."""
    if "error" in result:
        return f"Error: {str(result['error'])[:100]}"
    if tool_name == "get_company_overview":
        profile = result.get("profile", {})
        metrics = result.get("financial_metrics", {})
        pe = metrics.get("pe_ratio")
        return f"{profile.get('name', '?')} — P/E: {pe}" if pe else profile.get("name", "OK")
    if tool_name == "get_price_history":
        return f"{result.get('data_points', 0)} dias de datos ({result.get('start_date', '?')} a {result.get('end_date', '?')})"
    if tool_name == "get_news_sentiment":
        tickers = result.get("news_by_ticker", {})
        total = sum(t.get("article_count", 0) for t in tickers.values())
        return f"{total} articulos analizados para {len(tickers)} activos"
    if tool_name == "get_technical_indicators":
        comp = result.get("computed_indicators", {})
        rsi = comp.get("rsi_14")
        return f"RSI: {rsi}, Precio vs SMA200: {comp.get('price_vs_sma200', '?')}" if rsi else "OK"
    if tool_name == "run_backtest":
        perf = result.get("performance", {})
        return f"Retorno: {perf.get('total_return_pct', 0)}%, Sharpe: {perf.get('sharpe_ratio', 0)}, Drawdown: {perf.get('max_drawdown_pct', 0)}%"
    if tool_name == "get_economic_indicators":
        inds = result.get("indicators", {})
        events = result.get("upcoming_events", [])
        return f"{len(inds)} indicadores + {len(events)} eventos proximos"
    return "OK"


def _tool_to_dashboard_event(tool_name: str, result: dict) -> dict | None:
    """Auto-generate dashboard events from certain tool results."""
    if tool_name == "run_backtest" and "error" not in result:
        return {"type": "backtest_result", "data": result}
    return None
