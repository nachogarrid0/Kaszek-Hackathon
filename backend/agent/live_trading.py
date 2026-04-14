import asyncio
import json
import random
from datetime import datetime

from store.memory import store


def ts():
    return datetime.now().strftime("%H:%M:%S")


def delta(pos: dict, price_delta: float) -> dict:
    current_price = round(pos["current_price"] + price_delta, 2)
    pnl_usd = round((current_price - pos["entry_price"]) * pos["quantity"], 2)
    pnl_pct = round(((current_price - pos["entry_price"]) / pos["entry_price"]) * 100, 2)
    return {**pos, "current_price": current_price, "pnl_usd": pnl_usd, "pnl_pct": pnl_pct}


def build_portfolio(positions: list[dict]) -> dict:
    total_pnl = round(sum(p["pnl_usd"] for p in positions), 2)
    capital = sum(p["entry_price"] * p["quantity"] for p in positions)
    total_pnl_pct = round((total_pnl / capital) * 100, 2) if capital > 0 else 0
    losing = [p for p in positions if p["pnl_usd"] < 0]
    capital_at_risk = round(sum(abs(p["pnl_usd"]) for p in losing), 2)
    daily_return = round(total_pnl_pct * 0.18, 2)
    total_alloc = len(positions)
    allocation_pie = [
        {"symbol": p["symbol"], "pct": round(100 / total_alloc, 1)} if total_alloc > 0 else {"symbol": p["symbol"], "pct": 0}
        for p in positions
    ]
    gains_pie = [{"symbol": p["symbol"], "gain": p["pnl_usd"]} for p in positions]

    return {
        "total_pnl": total_pnl,
        "total_pnl_pct": total_pnl_pct,
        "daily_return": daily_return,
        "capital_at_risk": capital_at_risk,
        "positions": positions,
        "allocation_pie": allocation_pie,
        "gains_pie": gains_pie,
    }


BULL_AGENT_MESSAGES = [
    "Analizando momentum en el sector tech. NVDA muestra señales alcistas — incrementando exposición.",
    "AAPL consolidando sobre soporte clave en $190. Manteniendo posición.",
    "El mercado está reaccionando positivamente a los datos de empleo. Tech liderando el alza.",
    "META aceleró volumen en las últimas horas. La tendencia se mantiene sólida.",
    "Revisando correlaciones entre MSFT y GOOGL. Diversificación saludable.",
    "PnL total supera el 3% diario. Estrategia funcionando dentro de parámetros esperados.",
]

BULL_TRADES = [
    {"action": "BUY", "symbol": "NVDA", "qty": 10, "price": 921.5},
    {"action": "HOLD", "symbol": "AAPL", "qty": 0, "price": 191.2},
    {"action": "HOLD", "symbol": "META", "qty": 0, "price": 531.0},
    {"action": "BUY", "symbol": "MSFT", "qty": 5, "price": 424.8},
    {"action": "SELL", "symbol": "GOOGL", "qty": 10, "price": 179.1},
    {"action": "BUY", "symbol": "NVDA", "qty": 5, "price": 928.3},
]


async def live_trading_stream(strategy_id: str):
    # Determine scenario based on strategy_id (or just default)
    # We will simulate a "bull" scenario dynamically using the assets from the actual strategy if available
    strategy = store.get_strategy(strategy_id)
    
    positions = []
    if strategy and strategy.get("assets"):
        # Initialize positions from strategy assets
        for idx, asset in enumerate(strategy["assets"]):
            ticker = asset.get("ticker", f"AST{idx}")
            entry = random.uniform(100, 500)
            positions.append({
                "symbol": ticker,
                "entry_price": entry,
                "current_price": entry,
                "pnl_usd": 0,
                "pnl_pct": 0,
                "status": "HOLD",
                "quantity": 100,
            })
    else:
        # Fallback default positions
        positions = [
            {"symbol": "AAPL", "entry_price": 182.4, "current_price": 191.2, "pnl_usd": 880, "pnl_pct": 4.83, "status": "HOLD", "quantity": 100},
            {"symbol": "MSFT", "entry_price": 415.0, "current_price": 424.8, "pnl_usd": 980, "pnl_pct": 2.36, "status": "HOLD", "quantity": 100},
            {"symbol": "NVDA", "entry_price": 875.8, "current_price": 921.5, "pnl_usd": 4570, "pnl_pct": 5.22, "status": "BUY", "quantity": 100},
        ]

    # Initial portfolio
    portfolio = build_portfolio(positions)
    yield f"data: {json.dumps({'event': 'portfolio_update', 'data': portfolio})}\n\n"
    
    msg_idx = 0
    trade_idx = 0
    cycle = 0

    while True:
        await asyncio.sleep(4)
        cycle += 1
        
        # Check if strategy was approved (for rotation scenarios)
        # We'll just stream steady updates for now. The mock logic had intervals:
        # Every 8s: agent message
        # Every 4s: trade executed + portfolio update
        
        # 1. Update Portfolio Prices
        positions = [delta(p, round(random.uniform(-0.45, 0.45) * 1.5, 2)) for p in positions]
        portfolio = build_portfolio(positions)
        yield f"data: {json.dumps({'event': 'portfolio_update', 'data': portfolio})}\n\n"

        # 2. Agent Message (every 8s approx)
        if cycle % 2 == 0:
            content = BULL_AGENT_MESSAGES[msg_idx % len(BULL_AGENT_MESSAGES)]
            msg_idx += 1
            yield f"data: {json.dumps({'event': 'agent_message', 'data': {'content': content, 'timestamp': ts()}})}\n\n"
            
        # 3. Trade (every 4s)
        trade = BULL_TRADES[trade_idx % len(BULL_TRADES)]
        trade_idx += 1
        # Overwrite symbol to match one of our actual positions if possible
        if len(positions) > 0:
            trade["symbol"] = positions[trade_idx % len(positions)]["symbol"]
            
        yield f"data: {json.dumps({'event': 'trade_executed', 'data': {**trade, 'timestamp': ts()}})}\n\n"

        # 4. Strategy Obsolete Trigger
        if cycle == 8: # After ~32 seconds, trigger a strategy obsolete event
            pending = {
                "reason": f"Detecté un cambio de régimen en el sector. Propongo rotación sectorial.",
                "old_strategy": {"assets": [{"symbol": p["symbol"], "allocation": 20} for p in positions]},
                "new_strategy": {"assets": [{"symbol": "GLD", "allocation": 50}, {"symbol": "TLT", "allocation": 50}]},
                "changes": [
                    "- Salida total de exposición agresiva de acciones.",
                    "+ Incremento en activos refugio como ORO y bonos (GLD, TLT).",
                    "Stop-loss general ajustado al 2%."
                ]
            }
            yield f"data: {json.dumps({'event': 'strategy_obsolete', 'data': pending})}\n\n"
            
            # Pause emitting until approval logic is handled (or simulate infinite loop waiting)
            # In real implementation we'd check an approval flag in memory store
            await asyncio.sleep(20) 
