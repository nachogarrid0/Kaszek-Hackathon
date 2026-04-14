from __future__ import annotations

from store.memory import store


KNOWN_ASSETS = {
    "AAPL": {"name": "Apple Inc.", "sector": "Technology"},
    "MSFT": {"name": "Microsoft Corp.", "sector": "Technology"},
    "NVDA": {"name": "NVIDIA Corp.", "sector": "Technology/AI"},
    "GOOGL": {"name": "Alphabet Inc.", "sector": "Technology"},
    "AMZN": {"name": "Amazon.com Inc.", "sector": "Technology/E-commerce"},
    "TSLA": {"name": "Tesla Inc.", "sector": "EV/Technology"},
    "META": {"name": "Meta Platforms Inc.", "sector": "Technology/Social"},
    "SPY": {"name": "S&P 500 ETF", "sector": "Index"},
    "QQQ": {"name": "Nasdaq 100 ETF", "sector": "Tech Index"},
    "ARKK": {"name": "ARK Innovation ETF", "sector": "Innovation"},
    "BTC-USD": {"name": "Bitcoin", "sector": "Crypto"},
    "ETH-USD": {"name": "Ethereum", "sector": "Crypto"},
    "AMD": {"name": "AMD Inc.", "sector": "Semiconductors"},
    "AVGO": {"name": "Broadcom Inc.", "sector": "Semiconductors"},
    "CRM": {"name": "Salesforce Inc.", "sector": "Cloud/SaaS"},
}


async def handle_identify_assets(input_data: dict, strategy_id: str) -> dict:
    """The agent calls this with its own asset selection. We validate and enrich."""
    assets = []
    for symbol, info in KNOWN_ASSETS.items():
        assets.append({
            "symbol": symbol,
            "name": info["name"],
            "sector": info["sector"],
            "available": True,
        })

    store.update_session(strategy_id, {"available_assets": assets})

    return {
        "available_assets": assets,
        "note": (
            "Estos son los activos disponibles con datos históricos. "
            "Seleccioná los que mejor se alineen con la tesis del usuario "
            "y asigná porcentajes de allocation que sumen 100%."
        ),
    }
