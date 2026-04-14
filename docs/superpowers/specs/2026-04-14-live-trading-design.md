# Live Trading Tab — Design Spec

**Date:** 2026-04-14  
**Status:** Approved  
**Scope:** Frontend only — all data via mock. No backend changes.

---

## Overview

A new route `/live/:strategyId` that lets the user observe an autonomous trading agent operating on a previously approved strategy. The agent self-monitors the strategy's validity, pauses for user approval when it detects obsolescence, and resumes once approved or rejected. All data is mocked to demonstrate realistic trading scenarios across short, mid, and long-term strategy profiles.

---

## Entry Point

- A **"Live Trading"** button appears in the navbar and inside the chat panel once a strategy has been approved by the user.
- Both link to `/live/:strategyId`.
- The navbar shows a live indicator dot (●) when a session is active.

---

## Layout — 3 Columns

```
┌──────────────────────────────────────────────────────────────────┐
│  NAVBAR  [Dashboard] [Strategies] [Live Trading ●]               │
├──────────────┬───────────────────────────────┬───────────────────┤
│ Agent Stream │      Portfolio Dashboard       │   Activity Log    │
│   (left)     │         (center)               │    (right)        │
└──────────────┴───────────────────────────────┴───────────────────┘
```

Column widths: 25% / 50% / 25%

---

## Panel: Agent Stream (left)

- Read-only scrolling text stream of the agent's reasoning in natural language.
- Each message includes a timestamp.
- Auto-scrolls to the latest message.
- Visually identical to the existing chat component but without input.
- Source: `agent_message` SSE events (mocked).

---

## Panel: Portfolio Dashboard (center)

### Row 1 — Metrics Cards (4 cards)

| Card | Value |
|------|-------|
| Total PnL | $ amount + % |
| Daily Return | % with trend arrow |
| Assets in Profit vs Loss | X green / Y red |
| Capital at Risk | $ amount |

Cards use the same `MetricsCards` visual style as the existing dashboard.

### Row 2 — Two Pie Charts (side by side)

- **Allocation Pie**: portfolio weight per asset (% of total capital).
- **Gains Pie**: each asset's contribution to total accumulated gain ($ or %).

Both use Recharts `PieChart` / `RadialBarChart`. Labels show symbol + value on hover.

### Row 3 — Positions Table

Columns: Asset | Entry Price | Current Price | PnL $ | PnL % | Status badge

- PnL $ and PnL % are colored green (positive) or red (negative).
- Status badge values: `BUY` (blue) | `HOLD` (gray) | `SELL` (red).
- Table updates on every `portfolio_update` event.

---

## Panel: Activity Log (right)

Two stacked sections with independent scroll.

### Trade Log

Chronological feed of executed trades:
```
14:32:01  BUY   AAPL  x10  @ $182.40
14:35:18  SELL  TSLA  x5   @ $241.10
14:41:00  HOLD  MSFT  —    strategy unchanged
```
Source: `trade_executed` SSE events.

### Strategy Log

Records every strategy lifecycle event:
```
[14:20]  ✓  Initial strategy loaded — Long-term, tech focus
[15:10]  ⚠  Agent detected obsolescence → awaiting approval
[15:13]  ✓  User approved → new strategy: Mid-term, balanced
```
Source: `strategy_obsolete` SSE events + approval responses.

---

## Pause State — Strategy Approval

When the agent emits a `strategy_obsolete` event:

1. Trading simulation pauses (no new mock events generated).
2. The center panel is overlaid with a dark semi-transparent backdrop.
3. A centered card appears:

```
┌──────────────────────────────────────────────┐
│  ⚠  El agente pausó el trading               │
│                                              │
│  La estrategia actual quedó obsoleta.        │
│  Nueva estrategia propuesta:                 │
│                                              │
│  Anterior: largo plazo, tech-heavy          │
│  Nueva:    mid-term, balanced               │
│                                              │
│  Cambios:  +NVDA +AMZN / -TSLA -META       │
│            Stop-loss: 3% → 5%               │
│                                              │
│  [Rechazar — seguir con anterior]  [Aprobar →] │
└──────────────────────────────────────────────┘
```

- **Aprobar**: calls `POST /api/live/:strategyId/approve` with `{ approved: true }`, logs to Strategy Log, resumes mock events.
- **Rechazar**: calls the same endpoint with `{ approved: false }`, logs rejection, resumes with original strategy.
- Agent Stream continues showing the agent's reasoning even while paused.

---

## API Contract (mocked on frontend)

All endpoints are implemented as mock functions in `src/services/mockLiveTrading.ts`. No real HTTP calls.

### State snapshot

```typescript
// GET /api/live/:strategyId/state
interface LiveTradingState {
  status: "running" | "paused" | "awaiting_approval";
  portfolio: {
    total_pnl: number;           // USD
    total_pnl_pct: number;       // %
    daily_return: number;        // %
    capital_at_risk: number;     // USD
    positions: Position[];
    allocation_pie: { symbol: string; pct: number }[];
    gains_pie: { symbol: string; gain: number }[];
  };
  pending_strategy_change?: {
    reason: string;
    old_strategy: StrategyParams;
    new_strategy: StrategyParams;
    changes: string[];           // human-readable diff lines
  };
}

interface Position {
  symbol: string;
  entry_price: number;
  current_price: number;
  pnl_usd: number;
  pnl_pct: number;
  status: "BUY" | "HOLD" | "SELL";
  quantity: number;
}
```

### SSE stream events

```typescript
// SSE /api/live/:strategyId/stream
type LiveEvent =
  | { event: "agent_message";     data: { content: string; timestamp: string } }
  | { event: "trade_executed";    data: { action: "BUY"|"SELL"|"HOLD"; symbol: string; qty: number; price: number; timestamp: string } }
  | { event: "portfolio_update";  data: LiveTradingState["portfolio"] }
  | { event: "strategy_obsolete"; data: LiveTradingState["pending_strategy_change"] }
```

### Approval

```typescript
// POST /api/live/:strategyId/approve
interface ApproveRequest  { approved: boolean }
interface ApproveResponse { status: "resumed" | "rejected"; active_strategy: StrategyParams }
```

---

## Mock Data Scenarios

Three scenario scripts in `src/services/mockLiveTrading.ts`, selectable via strategy timeframe:

| Scenario | Timeframe | Behavior |
|----------|-----------|----------|
| Bull run, tech | Short-term | High trade frequency, strategy stays valid, growing PnL |
| Market rotation | Mid-term | Agent detects obsolescence after ~30s, proposes sector rotation |
| Defensive pivot | Long-term | Low frequency, one strategy change mid-session |

Mock events fire on timers (e.g. every 2–4s for trades, every 8s for agent messages).

---

## New Files

```
frontend/src/app/live/[strategyId]/page.tsx       — route entry point
frontend/src/components/live/LiveLayout.tsx        — 3-column shell
frontend/src/components/live/AgentStream.tsx       — left panel
frontend/src/components/live/PortfolioDashboard.tsx — center panel
frontend/src/components/live/MetricsRow.tsx        — 4 metric cards
frontend/src/components/live/AllocationPie.tsx     — allocation chart
frontend/src/components/live/GainsPie.tsx          — gains chart
frontend/src/components/live/PositionsTable.tsx    — positions table
frontend/src/components/live/ActivityLog.tsx       — right panel (trade + strategy logs)
frontend/src/components/live/StrategyApprovalOverlay.tsx — pause/approval card
frontend/src/hooks/useLiveTrading.ts               — drives mock SSE loop + state
frontend/src/services/mockLiveTrading.ts           — mock data + scenario scripts
frontend/src/types/live.ts                         — LiveTradingState, Position, LiveEvent types
```

---

## Modified Files

```
frontend/src/components/layout/Header.tsx          — add Live Trading nav link + indicator dot
frontend/src/components/dashboard/ApproveButton.tsx — add "Go Live" button after approval
frontend/src/types/index.ts                         — re-export from live.ts or extend
```

---

## Out of Scope

- Real backend SSE endpoint for live trading
- Actual brokerage integration
- Persistent storage of live trading sessions
- Authentication / multi-user
