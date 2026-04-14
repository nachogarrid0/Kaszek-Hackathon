TOOLS = [
    {
        "name": "identify_assets",
        "description": (
            "Identifica los activos (acciones, ETFs, crypto) más relevantes "
            "para la tesis de inversión del usuario. Devuelve una lista de "
            "activos con porcentaje de asignación sugerido y razón."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "thesis": {
                    "type": "string",
                    "description": "La tesis de inversión del usuario en lenguaje natural",
                },
                "risk_tolerance": {
                    "type": "string",
                    "enum": ["conservative", "moderate", "aggressive"],
                    "description": "Tolerancia al riesgo inferida del usuario",
                },
                "investment_horizon": {
                    "type": "string",
                    "enum": ["short", "medium", "long"],
                    "description": "Horizonte temporal: short (<1y), medium (1-3y), long (>3y)",
                },
            },
            "required": ["thesis", "risk_tolerance", "investment_horizon"],
        },
    },
    {
        "name": "get_historical_data",
        "description": (
            "Obtiene datos históricos OHLCV de uno o más activos. "
            "Devuelve fechas, precios y volumen para cada símbolo."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "symbols": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Lista de símbolos (ej: ['NVDA', 'MSFT', 'AAPL'])",
                },
                "period": {
                    "type": "string",
                    "enum": ["1y", "2y", "3y", "5y"],
                    "description": "Período de datos históricos",
                },
            },
            "required": ["symbols", "period"],
        },
    },
    {
        "name": "run_backtest",
        "description": (
            "Ejecuta un backtest de la estrategia de inversión contra datos "
            "históricos. Devuelve métricas de rendimiento, curva de equity y "
            "lista de trades."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "assets": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "symbol": {"type": "string"},
                            "allocation": {"type": "number"},
                        },
                        "required": ["symbol", "allocation"],
                    },
                    "description": "Activos con su porcentaje de asignación",
                },
                "initial_capital": {
                    "type": "number",
                    "description": "Capital inicial en USD",
                    "default": 10000,
                },
                "stop_loss": {
                    "type": "number",
                    "description": "Stop-loss en porcentaje (ej: 5 = 5%)",
                },
                "take_profit": {
                    "type": "number",
                    "description": "Take-profit en porcentaje (ej: 15 = 15%)",
                },
                "rebalance_frequency": {
                    "type": "string",
                    "enum": ["monthly", "quarterly", "yearly", "none"],
                    "description": "Frecuencia de rebalanceo del portfolio",
                    "default": "quarterly",
                },
                "start_date": {
                    "type": "string",
                    "description": "Fecha inicio ISO (ej: 2021-01-01)",
                },
                "end_date": {
                    "type": "string",
                    "description": "Fecha fin ISO (ej: 2024-01-01)",
                },
            },
            "required": ["assets", "initial_capital", "start_date", "end_date"],
        },
    },
    {
        "name": "compare_with_benchmark",
        "description": (
            "Compara la curva de equity de la estrategia contra un benchmark "
            "(por defecto S&P500). Devuelve métricas comparativas."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "strategy_equity_curve": {
                    "type": "array",
                    "items": {"type": "number"},
                    "description": "Curva de equity de la estrategia",
                },
                "strategy_dates": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Fechas correspondientes a la curva de equity",
                },
                "benchmark": {
                    "type": "string",
                    "description": "Símbolo del benchmark (default: SPY)",
                    "default": "SPY",
                },
            },
            "required": ["strategy_equity_curve", "strategy_dates"],
        },
    },
    {
        "name": "update_dashboard",
        "description": (
            "Envía una actualización progresiva al dashboard del usuario. "
            "Usá esta tool para ir mostrando los resultados en tiempo real."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "enum": [
                        "assets",
                        "metrics",
                        "equity_curve",
                        "benchmark",
                        "strategy_params",
                        "strategy_complete",
                    ],
                    "description": "Tipo de actualización del dashboard",
                },
                "data": {
                    "type": "object",
                    "description": "Datos de la actualización (depende del type)",
                },
            },
            "required": ["type", "data"],
        },
    },
]
