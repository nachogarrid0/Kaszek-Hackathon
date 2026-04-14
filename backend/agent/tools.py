TOOLS = [
    {
        "name": "get_economic_indicators",
        "description": (
            "Fetches macroeconomic context: current values of key indicators "
            "(Federal Funds Rate, CPI, Treasury Yield) and upcoming economic events "
            "from the calendar. Use this at the START of your analysis to understand "
            "the macro environment before selecting assets.\n\n"
            "Returns current indicator values with trends, plus upcoming macro events "
            "(FOMC meetings, CPI releases, GDP reports, etc.)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "indicators": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": [
                            "FEDERAL_FUNDS_RATE", "CPI", "INFLATION",
                            "TREASURY_YIELD", "REAL_GDP", "UNEMPLOYMENT",
                        ],
                    },
                    "description": "List of macro indicators to query",
                },
            },
            "required": ["indicators"],
        },
    },
    {
        "name": "get_company_overview",
        "description": (
            "Fetches comprehensive fundamental data for a single company from Finnhub: "
            "company profile (name, sector, market cap), financial metrics (PE ratio, "
            "profit margin, revenue growth, ROE, beta, 52-week high/low), and analyst "
            "recommendation trends (buy/hold/sell counts). Use this to evaluate the "
            "fundamental quality of each asset you're considering."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Ticker symbol (e.g., 'NVDA')",
                },
            },
            "required": ["symbol"],
        },
    },
    {
        "name": "get_news_sentiment",
        "description": (
            "Fetches recent news articles for one or more tickers from Finnhub. "
            "Returns headlines, sources, dates, and summaries. Since sentiment scores "
            "are not available, YOU must analyze the headlines and summaries to determine "
            "the market's directional bias.\n\n"
            "Interpret sentiment yourself based on:\n"
            "- Headline tone (positive/negative language)\n"
            "- Article count and recency\n"
            "- Presence of catalysts (earnings, product launches, regulation)\n"
            "- Extreme clustering of positive or negative news"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "tickers": {
                    "type": "string",
                    "description": "Comma-separated ticker symbols (e.g., 'NVDA,MSFT,GOOGL')",
                },
                "days_back": {
                    "type": "integer",
                    "description": "How many days of news to fetch (default 30, max 90)",
                },
            },
            "required": ["tickers"],
        },
    },
    {
        "name": "get_price_history",
        "description": (
            "Fetches daily OHLCV (Open, High, Low, Close, Volume) price data from "
            "Finnhub. Returns chronologically sorted daily candles. Also stores the "
            "data in the session for use by the backtester and technical analysis."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Ticker symbol (e.g., 'NVDA')",
                },
                "period_years": {
                    "type": "integer",
                    "description": "Years of history to fetch (1-5, default 3)",
                },
            },
            "required": ["symbol"],
        },
    },
    {
        "name": "get_technical_indicators",
        "description": (
            "Fetches technical analysis for a stock: aggregated buy/sell/neutral "
            "signal counts from Finnhub, support/resistance levels, AND locally "
            "computed indicators (RSI-14, SMA-50, SMA-200, MACD, Bollinger Bands, "
            "ATR-14) from the price data already loaded.\n\n"
            "IMPORTANT: You must call get_price_history for this symbol BEFORE calling "
            "this tool, otherwise computed indicators will be unavailable.\n\n"
            "Use the results to determine:\n"
            "- RSI: >70 overbought, <30 oversold\n"
            "- SMA200: price above = uptrend, below = downtrend\n"
            "- MACD: crossover signals trend changes\n"
            "- Bollinger: position shows if overextended\n"
            "- ATR: defines stop-loss distance (typically 2x ATR)"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Ticker symbol (e.g., 'NVDA')",
                },
            },
            "required": ["symbol"],
        },
    },
    {
        "name": "run_backtest",
        "description": (
            "Executes a backtest of the complete portfolio strategy using the Python "
            "engine with the price data already loaded. Returns: total_return, CAGR, "
            "max_drawdown, Sharpe_ratio, Sortino_ratio, win_rate, profit_factor, "
            "equity_curve, monthly_returns, benchmark comparison (SPY), and performance "
            "by market regime (bull/bear/sideways).\n\n"
            "IMPORTANT: You must call get_price_history for ALL assets (including SPY) "
            "BEFORE calling this tool."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "strategy": {
                    "type": "object",
                    "properties": {
                        "allocations": {
                            "type": "object",
                            "description": "Ticker → percentage map. Must sum to 100.",
                        },
                        "entry_rules": {
                            "type": "object",
                            "properties": {
                                "rsi_oversold": {"type": "number"},
                                "require_above_sma200": {"type": "boolean"},
                                "macd_crossover": {"type": "boolean"},
                            },
                        },
                        "exit_rules": {
                            "type": "object",
                            "properties": {
                                "stop_loss_pct": {"type": "number"},
                                "take_profit_pct": {"type": "number"},
                                "trailing_stop_pct": {"type": "number"},
                                "rsi_overbought": {"type": "number"},
                            },
                        },
                        "rebalance_frequency": {
                            "type": "string",
                            "enum": ["monthly", "quarterly", "yearly", "on_signal"],
                        },
                    },
                },
                "initial_capital": {"type": "number"},
                "period_years": {"type": "integer"},
            },
            "required": ["strategy", "initial_capital", "period_years"],
        },
    },
    {
        "name": "update_dashboard",
        "description": (
            "Sends structured data to the user's dashboard for real-time progressive "
            "visualization. The frontend renders each type as a different dashboard "
            "section. Call this after completing each major analysis step.\n\n"
            "REQUIRED moments to call:\n"
            "- After interpreting macro indicators → type 'macro_context'\n"
            "- After selecting assets + running fundamentals → type 'assets_selected'\n"
            "- After analyzing sentiment → type 'sentiment_analysis'\n"
            "- After running technical analysis → type 'technical_signals'\n"
            "- After each backtest run → type 'backtest_result'\n"
            "- After the final strategy is ready → type 'final_strategy'"
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "enum": [
                        "macro_context",
                        "assets_selected",
                        "sentiment_analysis",
                        "technical_signals",
                        "backtest_result",
                        "final_strategy",
                    ],
                },
                "data": {
                    "type": "object",
                    "description": "Structured payload for the dashboard section",
                },
            },
            "required": ["type", "data"],
        },
    },
]
