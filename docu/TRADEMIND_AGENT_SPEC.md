# TradeMind AI — Agent Specification
## Claude Opus Autonomous Agent with Tool Calling

---

## 1. Agent Overview

The TradeMind agent is an autonomous Claude Opus instance that receives an investment thesis in natural language and executes a complete analysis pipeline without user intervention. It uses Anthropic's tool calling API to interact with real financial data (Alpha Vantage) and a local backtest engine, making decisions at each step based on the data it receives.

### Core Behavior

The agent operates as a **Level 3 autonomous agent**: it receives a single instruction (the user's thesis), plans the entire workflow, executes it step by step, self-corrects when results are unsatisfactory, and presents a final deliverable. The user does not intervene at any point during execution.

### Model

- **Model ID:** `claude-opus-4-0-20250514`
- **Max tokens:** 8192 per response
- **Temperature:** default (not set — let Claude use its default for reasoning tasks)

---

## 2. Agentic Loop

### Pattern

The agent follows the standard Anthropic tool-calling loop:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  1. Send [system_prompt + messages + tools] → Claude │
│                                                      │
│  2. Claude responds with:                            │
│     - text blocks (reasoning) + tool_use blocks      │
│     OR                                               │
│     - text only (stop_reason="end_turn") → DONE      │
│                                                      │
│  3. If tool_use:                                     │
│     a. Append assistant response to messages          │
│     b. Execute each tool, collect results             │
│     c. Append tool_results as "user" message          │
│     d. Go to step 1                                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Implementation

```python
import anthropic
import json

client = anthropic.Anthropic()


async def run_agent(user_thesis: str, session_id: str):
    """
    Core agentic loop.
    
    CRITICAL RULES:
    - messages alternates: user → assistant → user → assistant...
    - tool_results are sent as a "user" message containing an array of tool_result objects
    - each tool_result MUST include the tool_use_id from the corresponding tool_use block
    - the loop ends when stop_reason == "end_turn"
    - safety limit: max 30 iterations to prevent infinite loops
    """
    messages = [{"role": "user", "content": user_thesis}]
    iteration = 0
    max_iterations = 30

    while iteration < max_iterations:
        iteration += 1

        response = client.messages.create(
            model="claude-opus-4-0-20250514",
            max_tokens=8192,
            system=SYSTEM_PROMPT,
            tools=TOOL_DEFINITIONS,
            messages=messages
        )

        # Always append the full assistant content to messages
        assistant_content = response.content
        messages.append({"role": "assistant", "content": assistant_content})

        # Check if agent is done
        if response.stop_reason == "end_turn":
            final_text = ""
            for block in assistant_content:
                if block.type == "text":
                    final_text += block.text
            yield {"type": "final_message", "message": final_text}
            break

        # Process tool calls
        tool_results = []

        for block in assistant_content:
            if block.type == "text" and block.text.strip():
                # Claude's intermediate reasoning → stream to frontend chat
                yield {"type": "agent_thinking", "message": block.text}

            elif block.type == "tool_use":
                # Execute the tool
                yield {"type": "tool_start", "tool": block.name, "input": block.input}

                try:
                    result = await execute_tool(block.name, block.input)
                except Exception as e:
                    result = {"error": str(e)}

                # If it's a dashboard update, forward the payload to frontend
                if block.name == "update_dashboard":
                    yield {
                        "type": "dashboard_update",
                        "dashboard_type": block.input.get("type"),
                        "data": block.input.get("data", {})
                    }

                yield {"type": "tool_result", "tool": block.name, "result": result}

                # Build the tool_result message for Claude
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,   # MUST match the tool_use block's id
                    "content": json.dumps(result, ensure_ascii=False, default=str)
                })

        # Send tool results back to Claude
        if tool_results:
            messages.append({"role": "user", "content": tool_results})

    else:
        yield {"type": "error", "message": "Agent reached maximum iteration limit (30)"}
```

### Message History Structure

After a few iterations, the messages array looks like this:

```python
messages = [
    # Turn 1: User thesis
    {"role": "user", "content": "Creo que la IA va a dominar..."},
    
    # Turn 2: Claude's first response (reasoning + tool calls)
    {"role": "assistant", "content": [
        TextBlock(text="Voy a empezar analizando el contexto macro..."),
        ToolUseBlock(id="toolu_01ABC", name="get_economic_indicators", input={...})
    ]},
    
    # Turn 3: Tool results
    {"role": "user", "content": [
        {"type": "tool_result", "tool_use_id": "toolu_01ABC", "content": "{...json...}"}
    ]},
    
    # Turn 4: Claude's second response (more reasoning + more tool calls)
    {"role": "assistant", "content": [
        TextBlock(text="Las tasas de la Fed están en 4.25%..."),
        ToolUseBlock(id="toolu_02DEF", name="get_company_overview", input={...}),
        ToolUseBlock(id="toolu_03GHI", name="get_company_overview", input={...}),
        ToolUseBlock(id="toolu_04JKL", name="update_dashboard", input={...})
    ]},
    
    # Turn 5: Multiple tool results (one per tool_use)
    {"role": "user", "content": [
        {"type": "tool_result", "tool_use_id": "toolu_02DEF", "content": "{...}"},
        {"type": "tool_result", "tool_use_id": "toolu_03GHI", "content": "{...}"},
        {"type": "tool_result", "tool_use_id": "toolu_04JKL", "content": "{...}"}
    ]},
    
    # ... continues until stop_reason == "end_turn"
]
```

### Important Implementation Details

1. **Multiple tool calls per turn:** Claude can return multiple `tool_use` blocks in a single response. ALL of them must be executed, and ALL their results must be returned in the same `user` message.

2. **tool_use_id matching:** Each `tool_result` MUST include the exact `tool_use_id` from the corresponding `tool_use` block. Mismatched IDs cause API errors.

3. **Content serialization:** The `content` field in `tool_result` must be a string (JSON-serialized), not a raw object.

4. **Text between tool calls:** Claude often includes `text` blocks between or before `tool_use` blocks. These contain its reasoning and should be streamed to the user's chat as "thinking" messages.

5. **stop_reason values:**
   - `"end_turn"` → Claude is done, extract final text
   - `"tool_use"` → Claude wants to use tools, execute and return results
   - `"max_tokens"` → Response was truncated, may need to continue

---

## 3. System Prompt

The system prompt defines the agent's personality, workflow, and rules. It is sent as the `system` parameter in every API call (not as a message).

```python
SYSTEM_PROMPT = """You are an autonomous Senior Portfolio Advisor that combines fundamental and technical analysis with real data from Alpha Vantage. You receive an investment thesis in natural language from a person who does NOT know about trading, and your job is to convert it into a complete, backtested investment plan ready to approve.

YOU MUST EXECUTE THE ENTIRE 3-PHASE WORKFLOW AUTONOMOUSLY WITHOUT WAITING FOR USER INPUT.

═══════════════════════════════════════════════════════════
PHASE 1 — FUNDAMENTAL ANALYSIS
Goal: determine WHAT assets and WHY
═══════════════════════════════════════════════════════════

STEP 1.1 — MACRO CONTEXT
- Call get_economic_indicators with ["FEDERAL_FUNDS_RATE", "CPI", "TREASURY_YIELD"]
- Interpret the data: Are rates rising or falling? Is inflation decelerating? Does the yield curve suggest expansion or recession?
- Explain to the user in simple terms how the macro context affects their idea
- Call update_dashboard with type "macro_context" and structured data:
  {
    "fed_rate": { "current": <number>, "trend": "rising"|"falling"|"stable" },
    "cpi": { "current": <number>, "trend": "rising"|"falling"|"stable" },
    "treasury_10y": { "current": <number>, "trend": "rising"|"falling"|"stable" },
    "cycle_phase": "expansion"|"peak"|"contraction"|"trough",
    "thesis_alignment": "strong"|"moderate"|"weak"|"conflicting",
    "summary": "<brief explanation in Spanish>"
  }

STEP 1.2 — IDENTIFY ASSETS
- Based on the user's thesis, identify 3-5 relevant tickers
- For each one, call get_company_overview to get fundamental data
- Evaluate: P/E ratio vs sector average, profit margin, revenue growth, analyst consensus
- Determine a FUNDAMENTAL BIAS per asset:
  → Bullish: Revenue growing, margins improving, analysts bullish
  → Bearish: Revenue stagnant, margins compressing, analysts bearish
  → Neutral: Mixed signals
- Explain to the user WHY you chose each asset in simple language
- Call update_dashboard with type "assets_selected" and structured data:
  {
    "assets": [
      {
        "ticker": "<symbol>",
        "name": "<company name>",
        "sector": "<sector>",
        "allocation_pct": <number>,
        "fundamental_bias": "bullish"|"bearish"|"neutral",
        "pe_ratio": <number>,
        "revenue_growth_yoy": "<percentage string>",
        "profit_margin": "<percentage string>",
        "analyst_consensus": "<string>",
        "reasoning": "<explanation in Spanish>"
      }
    ]
  }

STEP 1.3 — SENTIMENT ANALYSIS
- Call get_news_sentiment with ALL selected tickers in a single call (comma-separated)
- Optionally filter by relevant topic (e.g., "technology" for tech thesis)
- For each ticker, analyze:
  → Average sentiment score: positive, negative, or neutral?
  → Ratio of bullish vs bearish articles
  → The most relevant headlines (is there an upcoming catalyst?)
- CROSS-REFERENCE sentiment with fundamentals:
  → Strong fundamentals + bullish sentiment = HIGH CONVICTION bullish
  → Strong fundamentals + bearish sentiment = potential contrarian opportunity (explain why)
  → Weak fundamentals + bullish sentiment = CAUTION, possible hype
  → Weak fundamentals + bearish sentiment = AVOID
- Identify TIME-BASED PATTERNS:
  → Cluster of recent negative news → possible ongoing bearish period
  → News about upcoming earnings, product launches, regulation → catalyst ahead
  → Extreme sentiment (>0.35 or <-0.35) → possible imminent reversal
- Call update_dashboard with type "sentiment_analysis" and structured data:
  {
    "ticker_sentiments": {
      "<TICKER>": {
        "avg_score": <number>,
        "label": "Bullish"|"Somewhat-Bullish"|"Neutral"|"Somewhat-Bearish"|"Bearish",
        "article_count": <number>,
        "bullish_pct": <number>,
        "bearish_pct": <number>,
        "neutral_pct": <number>,
        "top_headlines": ["<headline1>", "<headline2>", "<headline3>"],
        "catalyst_detected": <boolean>,
        "catalyst_description": "<description or null>"
      }
    },
    "market_regime": "risk_on"|"risk_off"|"neutral",
    "risk_events": [
      { "date": "<YYYY-MM-DD>", "event": "<description>", "impact": "high"|"medium"|"low" }
    ]
  }

═══════════════════════════════════════════════════════════
PHASE 2 — TECHNICAL ANALYSIS
Goal: determine WHEN and AT WHAT PRICE
═══════════════════════════════════════════════════════════

STEP 2.1 — GET PRICE DATA
- Call get_price_history for each selected asset AND for SPY (the benchmark)
- Note the date range and any gaps in data

STEP 2.2 — TECHNICAL INDICATORS
- For each asset, call get_technical_indicators with these indicators:
  → RSI(14): Overbought (>70) or oversold (<30)?
  → MACD: Bullish or bearish crossover? Histogram expanding or contracting?
  → SMA(50) and SMA(200): Price above or below each? Golden cross (SMA50 crosses above SMA200) or death cross (opposite)?
  → BBANDS(20): Price near upper band (overextended) or lower band (opportunity)?
  → ATR(14): How volatile is the asset? This defines the stop-loss distance

STEP 2.3 — CONFLUENCE ASSESSMENT
Evaluate the alignment between fundamental analysis (Phase 1) and technical analysis:

STRONG SIGNAL (aggressive position):
  - Fundamental bias: bullish
  - RSI < 50 (not overbought, room to run)
  - Price above SMA200 (confirmed uptrend)
  - MACD bullish crossover or positive histogram
  - Sentiment positive (> 0.15)
  → Assign higher allocation percentage

MODERATE SIGNAL (conservative position):
  - Fundamental bias: bullish
  - Technical indicators mixed (some positive, some neutral)
  → Assign moderate allocation, tighter stop-loss

CONFLICT SIGNAL (wait or minimal position):
  - Fundamental bias: bullish BUT price below SMA200, RSI falling, MACD bearish
  → Assign minimal allocation or skip entirely, explain why

ALERT SIGNAL (possible top — reduce exposure):
  - Extremely bullish sentiment (> 0.35 sustained)
  - RSI > 70 (overbought)
  - Price at or above upper Bollinger Band
  → Warning: possible reversal, reduce allocation

For each asset, define concrete levels:
  - Entry zone: based on technical supports (lower Bollinger Band, SMA50, recent support)
  - Stop-loss: based on ATR (typically 2× ATR below the nearest support level)
  - Price targets: based on resistances (upper Bollinger Band, 52-week high, analyst target)

- Call update_dashboard with type "technical_signals" and structured data:
  {
    "signals": {
      "<TICKER>": {
        "trend": "uptrend"|"downtrend"|"sideways",
        "signal": "buy"|"sell"|"hold",
        "signal_strength": <0.0 to 1.0>,
        "confluence": "strong"|"moderate"|"weak"|"conflict",
        "rsi": <number>,
        "macd_signal": "bullish_crossover"|"bearish_crossover"|"neutral",
        "price_vs_sma200": "above"|"below",
        "bollinger_position": "upper"|"middle"|"lower",
        "entry_zone": { "low": <number>, "high": <number> },
        "stop_loss": <number>,
        "targets": [<number>, <number>],
        "current_price": <number>,
        "atr": <number>
      }
    }
  }

═══════════════════════════════════════════════════════════
PHASE 3 — STRATEGY CONSTRUCTION + BACKTEST
═══════════════════════════════════════════════════════════

STEP 3.1 — BUILD THE STRATEGY
Combine all analysis into a concrete, testable plan:

Allocations:
  - Higher confluence → higher allocation percentage
  - Always include SPY as defensive anchor (10-20% of portfolio)
  - All allocations MUST sum to exactly 100%

Entry rules (for the backtest):
  - rsi_oversold: RSI threshold below which to consider buying (e.g., 40)
  - require_above_sma200: only enter if price is above the 200-day SMA (true/false)
  - macd_crossover: require a MACD bullish crossover to enter (true/false)
  - sentiment_min: minimum sentiment score to allow entry (e.g., -0.15 means "not bearish")

Exit rules:
  - stop_loss_pct: maximum loss before exiting (e.g., 8%)
  - take_profit_pct: target profit to start taking profits (e.g., 25%)
  - trailing_stop_pct: trailing stop from peak (e.g., 12%)
  - rsi_overbought: RSI level to consider exiting (e.g., 75)
  - sentiment_max_bearish: exit if sentiment drops below this (e.g., -0.25)

Rebalance frequency: monthly, quarterly, yearly, or on_signal

STEP 3.2 — RUN BACKTEST
- Call run_backtest with the complete strategy, initial_capital, and period_years
- Call update_dashboard with type "backtest_result" containing all metrics

STEP 3.3 — EVALUATE AND SELF-CORRECT
Check these criteria. If ANY fails, adjust and re-backtest:

| Metric | Threshold | Action if fails |
|--------|-----------|-----------------|
| Sharpe ratio | < 1.0 | Reduce volatile assets, add defensive positions |
| Max drawdown | > 25% | Tighten stop-loss, add trailing stop, reduce concentration |
| Return vs SPY | Below SPY without lower risk | Reassess asset selection or allocation weights |
| Profit factor | < 1.3 | Adjust entry/exit rules, tighten parameters |

CRITICAL: When adjusting, be SPECIFIC about what changed and why:
  "The backtest showed a 32% drawdown because NVDA had 45% allocation — too concentrated.
   Changes made:
   1. Reduced NVDA from 45% to 30% (lower concentration risk)
   2. Added 10% allocation to BND (bonds ETF as hedge)
   3. Tightened trailing stop from 15% to 12%
   Result: drawdown dropped from 32% to 19%, Sharpe improved from 0.8 to 1.4"

Maximum 3 adjustment iterations. If metrics still don't meet thresholds after 3 tries, present the best result with clear caveats about the risks.

STEP 3.4 — PRESENT FINAL RESULT
- Call update_dashboard with type "final_strategy" containing the complete data from all phases
- Write an executive summary with this exact structure:
  1. "Tu idea en números" — what the strategy would have returned historically
  2. "Los activos y por qué" — fundamentals + sentiment summarized per asset
  3. "Qué dice el mercado" — current sentiment and upcoming catalysts/events
  4. "Cuándo entrar y a qué precio" — technical signals and price zones
  5. "Protección contra pérdidas" — stop-loss, diversification, worst-case scenario
  6. "Lo que ajusté durante el análisis" — full transparency of the process
  7. "Comparación contra el S&P500" — direct comparison of strategy vs benchmark

═══════════════════════════════════════════════════════════
COMMUNICATION RULES
═══════════════════════════════════════════════════════════

Language:
- ALWAYS respond in Spanish
- All dashboard data values (numbers, labels) can be in English for consistency
- All explanatory text in chat MUST be in Spanish

Tone:
- Speak as if talking to someone intelligent but not technical
- When using a technical term for the first time, explain it in parentheses:
  "El RSI (un indicador que mide si un activo está sobrecomprado o sobrevendido) está en 72"
- Be specific with numbers — never vague
  BAD: "The stock has been performing well"
  GOOD: "NVDA grew 122% in revenue year-over-year and has a profit margin of 55.8%"

Transparency:
- When citing news from the sentiment analysis, mention the source and sentiment score
- When adjusting the strategy, explain exactly what changed and the numerical impact
- Never say "I recommend investing" — present data and let the user decide
- Acknowledge when data is limited or when a call fails

═══════════════════════════════════════════════════════════
ANALYSIS RULES
═══════════════════════════════════════════════════════════

Ordering:
- Fundamental analysis ALWAYS goes first — it establishes direction
- Technical analysis CONFIRMS or QUESTIONS the fundamental bias — it establishes timing
- Sentiment acts as a FILTER — extreme readings are warning signals

Conflict resolution:
- When fundamental and technical disagree, prioritize technical for TIMING and fundamental for DIRECTION
- Example: "Fundamentals are strongly bullish for NVDA, but technically the price is below the 200-day SMA and RSI is falling. I'll assign a smaller allocation and wait for technical confirmation before suggesting full entry."

Sentiment interpretation:
- Score > 0.35 sustained → possible TOP (excessive hype, crowded trade)
- Score < -0.35 sustained → possible BOTTOM (panic selling, contrarian opportunity)
- Rapidly changing sentiment → increased volatility ahead

API optimization:
- Group multiple tickers in a single get_news_sentiment call when possible
- Only request technical indicators you will actually use in your analysis
- Don't repeat calls for data you already have
- If a call fails or returns an error, mention it to the user and continue with available data

═══════════════════════════════════════════════════════════
DASHBOARD UPDATE PROTOCOL
═══════════════════════════════════════════════════════════

Call update_dashboard at these SPECIFIC moments in the workflow:

| Moment | Dashboard type | What to include |
|--------|---------------|-----------------|
| After interpreting macro indicators | "macro_context" | Fed rate, CPI, Treasury yield, cycle phase, thesis alignment |
| After selecting assets + running fundamentals | "assets_selected" | Asset list with allocations, bias, key metrics, reasoning |
| After analyzing sentiment | "sentiment_analysis" | Sentiment scores per ticker, headlines, risk events |
| After running technical analysis | "technical_signals" | Indicators, signals, entry/stop/target per asset |
| After each backtest run | "backtest_result" | Performance metrics, equity curve, regime analysis, benchmark comparison |
| After the final strategy is ready | "final_strategy" | ALL data from all phases combined into one comprehensive object |

IMPORTANT: The update_dashboard calls are what drive the frontend dashboard to build progressively. Without them, the right side of the screen stays empty. Each call should include well-structured JSON data that the frontend can render directly.

The "final_strategy" update should contain EVERYTHING: macro context, selected assets with allocations, sentiment data, technical signals, backtest metrics, equity curve, and benchmark comparison — all in one payload. This is what gets saved when the user clicks "Approve"."""
```

---

## 4. Tool Definitions

These are the tool definitions sent to the Claude API in every request. They define what the agent CAN do.

### 4.1 get_news_sentiment

**Purpose:** Fetch news articles and AI-powered sentiment scores from Alpha Vantage.

**Alpha Vantage endpoint:** `GET https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=NVDA,MSFT&apikey=...`

**When Claude should call it:** During Phase 1, Step 1.3, after identifying the target assets.

**Key parameters:**
- `tickers` (required): Comma-separated symbols. Example: `"NVDA,MSFT,GOOGL,AMD"`
- `topics` (optional): Filter by topic. Useful options for common theses:
  - `"technology"` — for tech/AI theses
  - `"earnings"` — around earnings season
  - `"economy_monetary"` — for interest rate sensitive theses
  - `"blockchain"` — for crypto-adjacent theses
- `time_from` (optional): Start date in `YYYYMMDDTHHMM` format. Use to get recent news only.
- `sort`: `"RELEVANCE"` (default), `"LATEST"`, or `"EARLIEST"`
- `limit`: Number of articles, max 200

**What Alpha Vantage returns per article:**
```json
{
  "title": "NVIDIA Reports Record Revenue...",
  "url": "https://...",
  "time_published": "20260410T120000",
  "summary": "NVIDIA Corporation reported...",
  "source": "CNBC",
  "overall_sentiment_score": 0.234,
  "overall_sentiment_label": "Somewhat-Bullish",
  "ticker_sentiment": [
    {
      "ticker": "NVDA",
      "relevance_score": "0.854",
      "ticker_sentiment_score": "0.312",
      "ticker_sentiment_label": "Somewhat-Bullish"
    }
  ]
}
```

**Sentiment score ranges:**
| Score range | Label |
|-------------|-------|
| x ≤ -0.35 | Bearish |
| -0.35 < x ≤ -0.15 | Somewhat-Bearish |
| -0.15 < x < 0.15 | Neutral |
| 0.15 ≤ x < 0.35 | Somewhat-Bullish |
| x ≥ 0.35 | Bullish |

**What the backend should return to Claude** (processed):
```json
{
  "ticker_summary": {
    "NVDA": {
      "avg_sentiment": 0.2341,
      "label": "Somewhat-Bullish",
      "article_count": 45,
      "bullish_count": 27,
      "bearish_count": 7,
      "neutral_count": 11
    }
  },
  "top_articles": [
    {
      "title": "...",
      "source": "CNBC",
      "published": "20260410T120000",
      "overall_sentiment": "Somewhat-Bullish",
      "overall_score": 0.234,
      "ticker_sentiments": {
        "NVDA": { "score": 0.312, "label": "Somewhat-Bullish", "relevance": 0.854 }
      }
    }
  ],
  "total_articles_analyzed": 45
}
```

**Tool definition:**
```python
{
    "name": "get_news_sentiment",
    "description": (
        "Fetches news articles and AI-powered sentiment scores from Alpha Vantage "
        "for one or more tickers. Each article includes: title, summary, source, "
        "date, overall_sentiment_score, overall_sentiment_label, and per-ticker "
        "sentiment scores with relevance. Use this to determine the market's "
        "directional bias on an asset.\n\n"
        "Sentiment score interpretation:\n"
        "  <= -0.35: Bearish\n"
        "  -0.35 to -0.15: Somewhat-Bearish\n"
        "  -0.15 to 0.15: Neutral\n"
        "  0.15 to 0.35: Somewhat-Bullish\n"
        "  >= 0.35: Bullish\n\n"
        "IMPORTANT: Extreme sustained sentiment (>0.35 or <-0.35) can signal "
        "potential reversal — excessive hype or panic selling."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "tickers": {
                "type": "string",
                "description": "Comma-separated ticker symbols (e.g., 'NVDA,MSFT,GOOGL')"
            },
            "topics": {
                "type": "string",
                "description": "Filter by topic: technology, earnings, ipo, mergers_and_acquisitions, financial_markets, economy_fiscal, economy_monetary, economy_macro, energy_transportation, finance, life_sciences, manufacturing, real_estate, retail_wholesale, blockchain"
            },
            "time_from": {
                "type": "string",
                "description": "Start of time range in YYYYMMDDTHHMM format (e.g., '20260301T0000')"
            },
            "sort": {
                "type": "string",
                "enum": ["LATEST", "EARLIEST", "RELEVANCE"]
            },
            "limit": {
                "type": "integer",
                "description": "Number of articles (max 200, default 50)"
            }
        },
        "required": ["tickers"]
    }
}
```

### 4.2 get_company_overview

**Purpose:** Fetch comprehensive fundamental data for a single company.

**Alpha Vantage endpoint:** `GET https://www.alphavantage.co/query?function=OVERVIEW&symbol=NVDA&apikey=...`

**When Claude should call it:** During Phase 1, Step 1.2, once per asset.

**Key fields returned:**
- `PERatio`, `PEGRatio` — valuation
- `ProfitMargin`, `OperatingMarginTTM` — profitability
- `RevenueTTM`, `RevenuePerShareTTM` — revenue
- `ReturnOnEquityTTM`, `ReturnOnAssetsTTM` — efficiency
- `Beta` — volatility relative to market
- `52WeekHigh`, `52WeekLow` — price range context
- `AnalystTargetPrice` — consensus price target
- `AnalystRatingStrongBuy/Buy/Hold/Sell/StrongSell` — analyst distribution

**Tool definition:**
```python
{
    "name": "get_company_overview",
    "description": (
        "Fetches comprehensive fundamental data for a company from Alpha Vantage: "
        "description, sector, industry, market_cap, PE_ratio, PEG_ratio, profit_margin, "
        "operating_margin, return_on_equity, revenue_TTM, beta, 52_week_high/low, "
        "analyst_target_price, analyst_ratings (buy/hold/sell counts). "
        "Use this to evaluate the fundamental quality of each asset."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "symbol": {
                "type": "string",
                "description": "Ticker symbol (e.g., 'NVDA')"
            }
        },
        "required": ["symbol"]
    }
}
```

### 4.3 get_economic_indicators

**Purpose:** Fetch macroeconomic data to understand the current economic cycle.

**Alpha Vantage endpoints:** One call per indicator:
- `function=FEDERAL_FUNDS_RATE`
- `function=CPI&interval=monthly`
- `function=TREASURY_YIELD&interval=monthly&maturity=10year`
- `function=INFLATION`
- `function=REAL_GDP&interval=quarterly`
- `function=UNEMPLOYMENT`
- `function=RETAIL_SALES`

**When Claude should call it:** During Phase 1, Step 1.1, at the very beginning.

**Typical call:** Claude requests 2-3 indicators (Fed rate, CPI, Treasury yield) to quickly assess the macro environment.

**Tool definition:**
```python
{
    "name": "get_economic_indicators",
    "description": (
        "Fetches macroeconomic indicators from Alpha Vantage. Use this to understand "
        "the macro context: Are we in expansion or contraction? Are rates rising or "
        "falling? How is inflation trending? Returns the latest 6 data points for "
        "each indicator to show the trend."
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
                        "TREASURY_YIELD", "REAL_GDP", "UNEMPLOYMENT", "RETAIL_SALES"
                    ]
                },
                "description": "List of macro indicators to query"
            }
        },
        "required": ["indicators"]
    }
}
```

### 4.4 get_price_history

**Purpose:** Fetch daily OHLCV price data for technical analysis and backtesting.

**Alpha Vantage endpoint:** `GET https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=NVDA&outputsize=compact&apikey=...`

**When Claude should call it:** During Phase 2, Step 2.1, once per asset plus once for SPY.

**Output:**
- `compact` = last 100 data points (free tier)
- `full` = 20+ years of history (premium)

**Tool definition:**
```python
{
    "name": "get_price_history",
    "description": (
        "Fetches daily OHLCV (Open, High, Low, Close, Volume) price data from "
        "Alpha Vantage. Returns chronologically sorted daily candles."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "symbol": {
                "type": "string",
                "description": "Ticker symbol (e.g., 'NVDA')"
            },
            "outputsize": {
                "type": "string",
                "enum": ["compact", "full"],
                "description": "compact = last 100 days (free), full = 20+ years (premium)"
            }
        },
        "required": ["symbol"]
    }
}
```

### 4.5 get_technical_indicators

**Purpose:** Fetch pre-computed technical indicators from Alpha Vantage. No local calculation needed.

**Alpha Vantage endpoints:** One call per indicator:
- `function=RSI&symbol=NVDA&interval=daily&time_period=14&series_type=close`
- `function=MACD&symbol=NVDA&interval=daily&series_type=close`
- `function=SMA&symbol=NVDA&interval=daily&time_period=50&series_type=close`
- `function=SMA&symbol=NVDA&interval=daily&time_period=200&series_type=close`
- `function=BBANDS&symbol=NVDA&interval=daily&time_period=20&series_type=close`
- `function=ATR&symbol=NVDA&interval=daily&time_period=14`

**When Claude should call it:** During Phase 2, Step 2.2, once per asset with the relevant indicators.

**How Claude uses each indicator:**

| Indicator | What it tells Claude | Action triggers |
|-----------|---------------------|-----------------|
| RSI(14) | Overbought/oversold momentum | >70 = overbought (caution), <30 = oversold (opportunity) |
| MACD | Trend momentum + crossovers | Signal line crossover = trend change signal |
| SMA(50) | Medium-term trend | Price above = bullish, below = bearish |
| SMA(200) | Long-term trend | Price above = confirmed uptrend, below = downtrend |
| BBANDS(20) | Volatility envelope | Upper band = overextended, lower band = potential entry |
| ATR(14) | Volatility magnitude | Defines stop-loss distance (typically 2× ATR) |

**Tool definition:**
```python
{
    "name": "get_technical_indicators",
    "description": (
        "Fetches pre-computed technical indicators from Alpha Vantage. "
        "Available: RSI (overbought/oversold), MACD (trend momentum), "
        "SMA/EMA (trend direction), BBANDS (volatility bands), ATR (volatility "
        "magnitude), STOCH (stochastic), ADX (trend strength), OBV (volume).\n\n"
        "Typical analysis set: RSI(14), MACD, SMA(50), SMA(200), BBANDS(20), ATR(14)"
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "symbol": {"type": "string"},
            "indicators": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "function": {
                            "type": "string",
                            "enum": ["RSI", "MACD", "SMA", "EMA", "BBANDS", "ATR", "STOCH", "ADX", "OBV"]
                        },
                        "time_period": {
                            "type": "integer",
                            "description": "Period (e.g., 14 for RSI, 50 or 200 for SMA)"
                        }
                    },
                    "required": ["function"]
                }
            },
            "interval": {
                "type": "string",
                "enum": ["daily", "weekly", "monthly"]
            }
        },
        "required": ["symbol", "indicators"]
    }
}
```

### 4.6 run_backtest

**Purpose:** Run a backtest of the constructed strategy against historical data.

**This is a LOCAL tool** — it does not call Alpha Vantage. It runs in the Python backend using numpy.

**When Claude should call it:** During Phase 3, Step 3.2, and again in Step 3.3 if adjustments are needed.

**What Claude sends:**
```json
{
  "strategy": {
    "allocations": { "NVDA": 35, "MSFT": 25, "GOOGL": 20, "SPY": 20 },
    "entry_rules": {
      "rsi_oversold": 40,
      "require_above_sma200": true,
      "macd_crossover": true,
      "sentiment_min": -0.15
    },
    "exit_rules": {
      "stop_loss_pct": 8,
      "take_profit_pct": 25,
      "trailing_stop_pct": 12,
      "rsi_overbought": 75,
      "sentiment_max_bearish": -0.25
    },
    "rebalance_frequency": "quarterly"
  },
  "initial_capital": 10000,
  "period_years": 3
}
```

**What the engine returns:**
```json
{
  "performance": {
    "total_return_pct": 145.3,
    "cagr_pct": 34.8,
    "max_drawdown_pct": -18.5,
    "sharpe_ratio": 1.62,
    "sortino_ratio": 2.1,
    "win_rate_pct": 64.0,
    "profit_factor": 1.85,
    "best_month_pct": 18.2,
    "worst_month_pct": -12.1
  },
  "benchmark_comparison": {
    "spy_total_return_pct": 52.1,
    "spy_sharpe": 0.95,
    "alpha_pct": 93.2,
    "beta": 1.25
  },
  "regime_performance": {
    "bull_market": { "return_pct": 89.0, "period": "2023-01 to 2024-06" },
    "bear_market": { "return_pct": -15.0, "period": "2022-01 to 2022-10" },
    "sideways": { "return_pct": 22.0, "period": "2024-07 to 2025-03" }
  },
  "equity_curve": [
    { "date": "2023-01-01", "portfolio": 10000, "benchmark": 10000 },
    { "date": "2023-02-01", "portfolio": 10450, "benchmark": 10120 }
  ],
  "monthly_returns": [
    { "month": "2023-01", "return_pct": 4.5 }
  ]
}
```

**Tool definition:**
```python
{
    "name": "run_backtest",
    "description": (
        "Executes a backtest of the complete strategy using the Python engine. "
        "Returns: total_return, CAGR, max_drawdown, Sharpe_ratio, Sortino_ratio, "
        "win_rate, profit_factor, equity_curve, monthly_returns, benchmark "
        "comparison (SPY), and performance by market regime (bull/bear/sideways)."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "strategy": {
                "type": "object",
                "properties": {
                    "allocations": {
                        "type": "object",
                        "description": "Ticker → percentage map. Must sum to 100."
                    },
                    "entry_rules": {
                        "type": "object",
                        "properties": {
                            "rsi_oversold": {"type": "number"},
                            "require_above_sma200": {"type": "boolean"},
                            "macd_crossover": {"type": "boolean"},
                            "sentiment_min": {"type": "number"}
                        }
                    },
                    "exit_rules": {
                        "type": "object",
                        "properties": {
                            "stop_loss_pct": {"type": "number"},
                            "take_profit_pct": {"type": "number"},
                            "trailing_stop_pct": {"type": "number"},
                            "rsi_overbought": {"type": "number"},
                            "sentiment_max_bearish": {"type": "number"}
                        }
                    },
                    "rebalance_frequency": {
                        "type": "string",
                        "enum": ["monthly", "quarterly", "yearly", "on_signal"]
                    }
                }
            },
            "initial_capital": {"type": "number"},
            "period_years": {"type": "integer"}
        },
        "required": ["strategy", "initial_capital", "period_years"]
    }
}
```

### 4.7 update_dashboard

**Purpose:** Send structured data to the frontend dashboard for progressive rendering.

**This is a UX tool** — it doesn't compute anything. Its job is to push data to the frontend via SSE so the dashboard builds itself while Claude works.

**When Claude should call it:** After completing each major analysis step (see the Dashboard Update Protocol table in the system prompt).

**Implementation note:** In the agentic loop, when the backend sees a `tool_use` for `update_dashboard`, it:
1. Returns `{"status": "dashboard_updated"}` to Claude
2. ALSO forwards the `data` payload as an SSE event of type `dashboard_update` to the frontend

**Tool definition:**
```python
{
    "name": "update_dashboard",
    "description": (
        "Sends structured data to the user's dashboard for real-time progressive "
        "visualization via SSE. The frontend renders each type as a different "
        "dashboard section. Call this after completing each major analysis step "
        "to keep the user engaged while the agent works."
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
                    "final_strategy"
                ]
            },
            "data": {
                "type": "object",
                "description": "Structured payload for the dashboard section"
            }
        },
        "required": ["type", "data"]
    }
}
```

---

## 5. Expected Agent Behavior — Example Trace

### Input
User thesis: "Creo que la inteligencia artificial va a dominar el mercado los próximos 2 años. Tengo $10.000 y puedo esperar."

### Expected tool call sequence

```
ITERATION 1:
  Claude thinks: "Voy a empezar analizando el contexto macroeconómico..."
  Claude calls: get_economic_indicators(["FEDERAL_FUNDS_RATE", "CPI", "TREASURY_YIELD"])

ITERATION 2:
  Claude thinks: "Las tasas están en 4.25% y bajando... esto favorece acciones tech de crecimiento..."
  Claude calls: update_dashboard(type="macro_context", data={...})
  Claude calls: get_company_overview(symbol="NVDA")
  Claude calls: get_company_overview(symbol="MSFT")
  Claude calls: get_company_overview(symbol="GOOGL")
  Claude calls: get_company_overview(symbol="AMD")

ITERATION 3:
  Claude thinks: "NVDA tiene el P/E más alto (55) pero también el mayor crecimiento (122%)..."
  Claude calls: update_dashboard(type="assets_selected", data={...})
  Claude calls: get_news_sentiment(tickers="NVDA,MSFT,GOOGL,AMD", topics="technology")

ITERATION 4:
  Claude thinks: "El sentimiento promedio para NVDA es 0.23 (Somewhat-Bullish). Hay 60% de noticias positivas..."
  Claude calls: update_dashboard(type="sentiment_analysis", data={...})
  Claude calls: get_price_history(symbol="NVDA")
  Claude calls: get_price_history(symbol="MSFT")
  Claude calls: get_price_history(symbol="GOOGL")
  Claude calls: get_price_history(symbol="AMD")
  Claude calls: get_price_history(symbol="SPY")

ITERATION 5:
  Claude calls: get_technical_indicators(symbol="NVDA", indicators=[RSI(14), MACD, SMA(50), SMA(200), BBANDS(20), ATR(14)])
  Claude calls: get_technical_indicators(symbol="MSFT", indicators=[...])
  Claude calls: get_technical_indicators(symbol="GOOGL", indicators=[...])
  Claude calls: get_technical_indicators(symbol="AMD", indicators=[...])

ITERATION 6:
  Claude thinks: "Analicemos la confluencia... NVDA: fundamental bullish + RSI 58 (neutral, room to run) + price above SMA200 + MACD positive → STRONG signal..."
  Claude calls: update_dashboard(type="technical_signals", data={...})

ITERATION 7:
  Claude thinks: "Construyo la estrategia: NVDA 35%, MSFT 25%, GOOGL 20%, SPY 20%..."
  Claude calls: run_backtest(strategy={...}, initial_capital=10000, period_years=3)

ITERATION 8:
  Claude thinks: "El backtest muestra Sharpe 1.62, drawdown -18.5%. Los números son buenos..."
  Claude calls: update_dashboard(type="backtest_result", data={...})

  OR if metrics fail:
  Claude thinks: "El drawdown es 32%, demasiado alto. Voy a ajustar..."
  Claude calls: run_backtest(adjusted_strategy={...})  // Iteration 8b

ITERATION 9:
  Claude calls: update_dashboard(type="final_strategy", data={...complete data...})
  Claude writes the executive summary (final text) → stop_reason="end_turn"
```

**Total iterations: ~9-11**
**Total Alpha Vantage API calls: ~17**
**Total tool calls: ~24**

---

## 6. Error Handling

### Alpha Vantage errors
When an API call fails, the tool executor should return a structured error:
```json
{"error": "Alpha Vantage rate limit: exceeded 25 calls/day on free tier"}
```

Claude should then:
1. Acknowledge the error to the user: "No pude obtener los datos de X. Voy a continuar con la información disponible."
2. Continue the analysis with whatever data it has
3. Note in the final summary which data was unavailable

### Agent safety limits
- **Max iterations: 30** — prevents infinite loops
- **Max backtest retries: 3** — prevents endless optimization
- **Timeout per tool execution: 30 seconds** — prevents hanging on slow APIs
- **If Claude returns `stop_reason="max_tokens"`** — the response was truncated. Append it to messages and send a follow-up "Please continue where you left off" message.

### Common failure modes
1. **Claude doesn't call update_dashboard** — the dashboard stays empty. The system prompt explicitly instructs when to call it.
2. **Claude asks the user a question instead of acting** — the system prompt says "execute autonomously without waiting for user input."
3. **Claude calls tools in wrong order** — the system prompt defines the phase sequence clearly.
4. **Alpha Vantage returns empty data** — typically when a ticker is invalid or the free tier limit is hit.
