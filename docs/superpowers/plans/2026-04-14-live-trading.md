# Live Trading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/live/:strategyId` route that displays a real-time portfolio dashboard driven by a mock trading agent, including agent reasoning stream, trade log, strategy change log, and a pause/approval overlay.

**Architecture:** All data is mocked on the frontend via a timer-based event emitter (`mockLiveTrading.ts`). A custom hook (`useLiveTrading`) subscribes to mock events and maintains local state. Components are purely presentational, reading from hook state. No backend changes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Recharts (already installed), Zustand (not used here — local hook state only), Tailwind v4, Lucide React.

---

## File Map

**Create:**
- `frontend/src/types/live.ts` — all Live Trading types
- `frontend/src/services/mockLiveTrading.ts` — scenario scripts + event emitter
- `frontend/src/hooks/useLiveTrading.ts` — state machine + event subscription
- `frontend/src/components/live/MetricsRow.tsx` — 4 metric cards
- `frontend/src/components/live/AllocationPie.tsx` — portfolio allocation donut
- `frontend/src/components/live/GainsPie.tsx` — gains-by-asset donut
- `frontend/src/components/live/PositionsTable.tsx` — positions with PnL + badge
- `frontend/src/components/live/PortfolioDashboard.tsx` — center panel (composes above)
- `frontend/src/components/live/AgentStream.tsx` — left panel, read-only message stream
- `frontend/src/components/live/ActivityLog.tsx` — right panel, trade log + strategy log
- `frontend/src/components/live/StrategyApprovalOverlay.tsx` — pause overlay + approve/reject
- `frontend/src/components/live/LiveLayout.tsx` — 3-column shell
- `frontend/src/app/live/[strategyId]/page.tsx` — route entry point

**Modify:**
- `frontend/src/components/layout/Header.tsx` — add Live Trading nav link
- `frontend/src/components/dashboard/ApproveButton.tsx` — add "Go Live" button after approval

---

## Task 1: Types

**Files:**
- Create: `frontend/src/types/live.ts`

- [ ] **Step 1: Create the types file**

```typescript
// frontend/src/types/live.ts
import type { StrategyParams } from "@/types";

export interface Position {
  symbol: string;
  entry_price: number;
  current_price: number;
  pnl_usd: number;
  pnl_pct: number;
  status: "BUY" | "HOLD" | "SELL";
  quantity: number;
}

export interface Portfolio {
  total_pnl: number;
  total_pnl_pct: number;
  daily_return: number;
  capital_at_risk: number;
  positions: Position[];
  allocation_pie: { symbol: string; pct: number }[];
  gains_pie: { symbol: string; gain: number }[];
}

export interface PendingStrategyChange {
  reason: string;
  old_strategy: StrategyParams;
  new_strategy: StrategyParams;
  changes: string[];
}

export interface LiveTradingState {
  status: "running" | "paused" | "awaiting_approval";
  portfolio: Portfolio;
  pending_strategy_change?: PendingStrategyChange;
}

export interface TradeLogEntry {
  action: "BUY" | "SELL" | "HOLD";
  symbol: string;
  qty: number;
  price: number;
  timestamp: string;
}

export interface StrategyLogEntry {
  type: "loaded" | "obsolete" | "approved" | "rejected";
  message: string;
  timestamp: string;
}

export type AgentMessageEvent = {
  event: "agent_message";
  data: { content: string; timestamp: string };
};
export type TradeExecutedEvent = {
  event: "trade_executed";
  data: TradeLogEntry;
};
export type PortfolioUpdateEvent = {
  event: "portfolio_update";
  data: Portfolio;
};
export type StrategyObsoleteEvent = {
  event: "strategy_obsolete";
  data: PendingStrategyChange;
};

export type LiveEvent =
  | AgentMessageEvent
  | TradeExecutedEvent
  | PortfolioUpdateEvent
  | StrategyObsoleteEvent;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run in `frontend/`:
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/live.ts
git commit -m "feat(live): add live trading types"
```

---

## Task 2: Mock Service

**Files:**
- Create: `frontend/src/services/mockLiveTrading.ts`

- [ ] **Step 1: Create the mock service**

```typescript
// frontend/src/services/mockLiveTrading.ts
import type {
  LiveEvent,
  Portfolio,
  Position,
  PendingStrategyChange,
} from "@/types/live";
import type { StrategyParams } from "@/types";

export type Scenario = "bull" | "rotation" | "defensive";

// ── Shared helpers ──────────────────────────────────────────────

function ts(): string {
  return new Date().toLocaleTimeString("es-AR", { hour12: false });
}

function delta(pos: Position, priceDelta: number): Position {
  const current_price = parseFloat((pos.current_price + priceDelta).toFixed(2));
  const pnl_usd = parseFloat(((current_price - pos.entry_price) * pos.quantity).toFixed(2));
  const pnl_pct = parseFloat((((current_price - pos.entry_price) / pos.entry_price) * 100).toFixed(2));
  return { ...pos, current_price, pnl_usd, pnl_pct };
}

function buildPortfolio(positions: Position[]): Portfolio {
  const total_pnl = parseFloat(positions.reduce((s, p) => s + p.pnl_usd, 0).toFixed(2));
  const capital = positions.reduce((s, p) => s + p.entry_price * p.quantity, 0);
  const total_pnl_pct = parseFloat(((total_pnl / capital) * 100).toFixed(2));
  const losing = positions.filter((p) => p.pnl_usd < 0);
  const capital_at_risk = parseFloat(losing.reduce((s, p) => s + Math.abs(p.pnl_usd), 0).toFixed(2));
  const daily_return = parseFloat((total_pnl_pct * 0.18).toFixed(2));

  const totalAlloc = positions.length;
  const allocation_pie = positions.map((p) => ({
    symbol: p.symbol,
    pct: parseFloat((100 / totalAlloc).toFixed(1)),
  }));

  const gains_pie = positions.map((p) => ({
    symbol: p.symbol,
    gain: p.pnl_usd,
  }));

  return { total_pnl, total_pnl_pct, daily_return, capital_at_risk, positions, allocation_pie, gains_pie };
}

// ── Scenario: Bull run, tech (short-term) ───────────────────────

const BULL_POSITIONS_INIT: Position[] = [
  { symbol: "AAPL", entry_price: 182.4,  current_price: 191.2,  pnl_usd: 880,   pnl_pct: 4.83, status: "HOLD", quantity: 100 },
  { symbol: "MSFT", entry_price: 415.0,  current_price: 424.8,  pnl_usd: 980,   pnl_pct: 2.36, status: "HOLD", quantity: 100 },
  { symbol: "NVDA", entry_price: 875.8,  current_price: 921.5,  pnl_usd: 4570,  pnl_pct: 5.22, status: "BUY",  quantity: 100 },
  { symbol: "GOOGL", entry_price: 174.3, current_price: 179.1,  pnl_usd: 480,   pnl_pct: 2.75, status: "HOLD", quantity: 100 },
  { symbol: "META", entry_price: 512.4,  current_price: 531.0,  pnl_usd: 1860,  pnl_pct: 3.63, status: "HOLD", quantity: 100 },
];

const BULL_AGENT_MESSAGES = [
  "Analizando momentum en el sector tech. NVDA muestra señales alcistas — incrementando exposición.",
  "AAPL consolidando sobre soporte clave en $190. Manteniendo posición.",
  "El mercado está reaccionando positivamente a los datos de empleo. Tech liderando el alza.",
  "META aceleró volumen en las últimas horas. La tendencia se mantiene sólida.",
  "Revisando correlaciones entre MSFT y GOOGL. Diversificación saludable.",
  "PnL total supera el 3% diario. Estrategia funcionando dentro de parámetros esperados.",
  "Monitoreando resistencia en NVDA $930. Si rompe, podría extenderse a $950.",
];

const BULL_TRADES: Array<{ action: "BUY" | "SELL" | "HOLD"; symbol: string; qty: number; price: number }> = [
  { action: "BUY",  symbol: "NVDA", qty: 10, price: 921.5 },
  { action: "HOLD", symbol: "AAPL", qty: 0,  price: 191.2 },
  { action: "HOLD", symbol: "META", qty: 0,  price: 531.0 },
  { action: "BUY",  symbol: "MSFT", qty: 5,  price: 424.8 },
  { action: "SELL", symbol: "GOOGL",qty: 10, price: 179.1 },
  { action: "BUY",  symbol: "NVDA", qty: 5,  price: 928.3 },
];

// ── Scenario: Market rotation (mid-term) ────────────────────────

const ROTATION_POSITIONS_INIT: Position[] = [
  { symbol: "AAPL", entry_price: 182.4, current_price: 187.1, pnl_usd: 470,  pnl_pct: 2.58, status: "HOLD", quantity: 100 },
  { symbol: "TSLA", entry_price: 241.1, current_price: 228.4, pnl_usd: -1270, pnl_pct: -5.27, status: "SELL", quantity: 100 },
  { symbol: "AMZN", entry_price: 184.2, current_price: 189.0, pnl_usd: 480,  pnl_pct: 2.61, status: "HOLD", quantity: 100 },
  { symbol: "MSFT", entry_price: 415.0, current_price: 408.5, pnl_usd: -650, pnl_pct: -1.57, status: "SELL", quantity: 100 },
  { symbol: "META", entry_price: 512.4, current_price: 504.1, pnl_usd: -830, pnl_pct: -1.62, status: "HOLD", quantity: 100 },
];

const ROTATION_OLD_STRATEGY: StrategyParams = {
  assets: ROTATION_POSITIONS_INIT.map((p) => ({ symbol: p.symbol, allocation: 20 })),
  stop_loss: 0.03,
  take_profit: 0.12,
  rebalance_frequency: "weekly",
};

const ROTATION_NEW_STRATEGY: StrategyParams = {
  assets: [
    { symbol: "NVDA", allocation: 25 },
    { symbol: "AMZN", allocation: 25 },
    { symbol: "AAPL", allocation: 20 },
    { symbol: "GLD",  allocation: 15 },
    { symbol: "BRK.B",allocation: 15 },
  ],
  stop_loss: 0.05,
  take_profit: 0.15,
  rebalance_frequency: "monthly",
};

const ROTATION_PENDING: PendingStrategyChange = {
  reason: "TSLA y MSFT perdieron momentum. El sector defensivo y commodities muestran fortaleza relativa.",
  old_strategy: ROTATION_OLD_STRATEGY,
  new_strategy: ROTATION_NEW_STRATEGY,
  changes: [
    "+ NVDA (25%) — líder en IA, momentum alcista",
    "+ GLD (15%) — cobertura ante incertidumbre macro",
    "+ BRK.B (15%) — defensivo y estable",
    "- TSLA — stop-loss activado, salida total",
    "- MSFT — reducción por rotación sectorial",
    "Stop-loss: 3% → 5%",
  ],
};

const ROTATION_AGENT_MESSAGES = [
  "Cargando estrategia mid-term. Revisando posiciones actuales.",
  "TSLA muestra debilidad estructural. El volumen de ventas superó al de compras en 3 sesiones consecutivas.",
  "MSFT por debajo de su media móvil de 50 días. Señal de alerta.",
  "El sector tech está perdiendo liderazgo frente a commodities y energía.",
  "Analizando correlación con el índice VIX. Volatilidad en aumento.",
  "⚠ Detecto que la estrategia actual perdió validez. Preparando propuesta de rotación sectorial.",
];

// ── Scenario: Defensive (long-term) ─────────────────────────────

const DEFENSIVE_POSITIONS_INIT: Position[] = [
  { symbol: "AAPL",  entry_price: 182.4, current_price: 184.1, pnl_usd: 170,  pnl_pct: 0.93, status: "HOLD", quantity: 100 },
  { symbol: "JNJ",   entry_price: 147.5, current_price: 149.8, pnl_usd: 230,  pnl_pct: 1.56, status: "HOLD", quantity: 100 },
  { symbol: "PG",    entry_price: 168.2, current_price: 170.5, pnl_usd: 230,  pnl_pct: 1.37, status: "HOLD", quantity: 100 },
  { symbol: "GLD",   entry_price: 182.3, current_price: 188.4, pnl_usd: 610,  pnl_pct: 3.35, status: "BUY",  quantity: 100 },
  { symbol: "BRK.B", entry_price: 365.0, current_price: 371.2, pnl_usd: 620,  pnl_pct: 1.70, status: "HOLD", quantity: 100 },
];

const DEFENSIVE_AGENT_MESSAGES = [
  "Estrategia defensiva de largo plazo activa. Foco en preservación de capital.",
  "GLD mostrando apreciación sostenida. El contexto macro favorece el oro.",
  "JNJ y PG como anclas defensivas. Baja correlación con el mercado general.",
  "BRK.B diversifica exposición sin aumentar volatilidad del portfolio.",
  "El ratio de Sharpe del portfolio se mantiene por encima de 1.2. Muy saludable.",
  "Revisando la estrategia frente al cambio en tasas de interés. Ajuste menor requerido.",
];

// ── Session runner ───────────────────────────────────────────────

export interface MockSession {
  stop: () => void;
  approve: (approved: boolean) => void;
}

export function startMockSession(
  scenario: Scenario,
  onEvent: (event: LiveEvent) => void
): MockSession {
  const intervals: ReturnType<typeof setInterval>[] = [];
  let stopped = false;
  let awaitingApproval = false;

  let positions =
    scenario === "bull"
      ? BULL_POSITIONS_INIT.map((p) => ({ ...p }))
      : scenario === "rotation"
      ? ROTATION_POSITIONS_INIT.map((p) => ({ ...p }))
      : DEFENSIVE_POSITIONS_INIT.map((p) => ({ ...p }));

  const agentMessages =
    scenario === "bull"
      ? BULL_AGENT_MESSAGES
      : scenario === "rotation"
      ? ROTATION_AGENT_MESSAGES
      : DEFENSIVE_AGENT_MESSAGES;

  const trades = scenario === "bull" ? BULL_TRADES : [];

  let msgIdx = 0;
  let tradeIdx = 0;

  // Agent messages every 8s
  const msgInterval = setInterval(() => {
    if (stopped || awaitingApproval) return;
    const content = agentMessages[msgIdx % agentMessages.length];
    msgIdx++;
    onEvent({ event: "agent_message", data: { content, timestamp: ts() } });
  }, 8000);
  intervals.push(msgInterval);

  // Trades every 4s (bull only)
  if (scenario === "bull" && trades.length > 0) {
    const tradeInterval = setInterval(() => {
      if (stopped || awaitingApproval) return;
      const t = trades[tradeIdx % trades.length];
      tradeIdx++;
      onEvent({ event: "trade_executed", data: { ...t, timestamp: ts() } });

      // Slight price movement after trade
      positions = positions.map((p) => {
        const shift = (Math.random() - 0.45) * 1.5;
        return delta(p, parseFloat(shift.toFixed(2)));
      });
      onEvent({ event: "portfolio_update", data: buildPortfolio(positions) });
    }, 4000);
    intervals.push(tradeInterval);
  }

  // Slow drift for defensive/rotation
  if (scenario !== "bull") {
    const driftInterval = setInterval(() => {
      if (stopped || awaitingApproval) return;
      positions = positions.map((p) => {
        const shift = (Math.random() - 0.45) * 0.8;
        return delta(p, parseFloat(shift.toFixed(2)));
      });
      onEvent({ event: "portfolio_update", data: buildPortfolio(positions) });
    }, 6000);
    intervals.push(driftInterval);
  }

  // Rotation: trigger strategy obsolete after 30s
  if (scenario === "rotation") {
    const obsoleteTimeout = setTimeout(() => {
      if (stopped) return;
      awaitingApproval = true;
      onEvent({ event: "strategy_obsolete", data: ROTATION_PENDING });
    }, 30000);
    intervals.push(obsoleteTimeout as unknown as ReturnType<typeof setInterval>);
  }

  return {
    stop() {
      stopped = true;
      intervals.forEach(clearInterval);
    },
    approve(approved: boolean) {
      awaitingApproval = false;
      if (approved) {
        // Update positions to new strategy
        positions = [
          { symbol: "NVDA",  entry_price: 875.8,  current_price: 890.0,  pnl_usd: 1420, pnl_pct: 1.62, status: "BUY",  quantity: 100 },
          { symbol: "AMZN",  entry_price: 184.2,  current_price: 189.0,  pnl_usd: 480,  pnl_pct: 2.61, status: "HOLD", quantity: 100 },
          { symbol: "AAPL",  entry_price: 182.4,  current_price: 187.1,  pnl_usd: 470,  pnl_pct: 2.58, status: "HOLD", quantity: 100 },
          { symbol: "GLD",   entry_price: 182.3,  current_price: 186.0,  pnl_usd: 370,  pnl_pct: 2.03, status: "BUY",  quantity: 100 },
          { symbol: "BRK.B", entry_price: 365.0,  current_price: 371.2,  pnl_usd: 620,  pnl_pct: 1.70, status: "HOLD", quantity: 100 },
        ];
        onEvent({ event: "portfolio_update", data: buildPortfolio(positions) });
      }
    },
  };
}

export function getInitialPortfolio(scenario: Scenario): Portfolio {
  const positions =
    scenario === "bull"
      ? BULL_POSITIONS_INIT.map((p) => ({ ...p }))
      : scenario === "rotation"
      ? ROTATION_POSITIONS_INIT.map((p) => ({ ...p }))
      : DEFENSIVE_POSITIONS_INIT.map((p) => ({ ...p }));
  return buildPortfolio(positions);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/mockLiveTrading.ts
git commit -m "feat(live): add mock live trading service with 3 scenarios"
```

---

## Task 3: useLiveTrading Hook

**Files:**
- Create: `frontend/src/hooks/useLiveTrading.ts`

- [ ] **Step 1: Create the hook**

```typescript
// frontend/src/hooks/useLiveTrading.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  Portfolio,
  TradeLogEntry,
  StrategyLogEntry,
  PendingStrategyChange,
} from "@/types/live";
import {
  startMockSession,
  getInitialPortfolio,
  type Scenario,
  type MockSession,
} from "@/services/mockLiveTrading";

export interface LiveTradingHook {
  status: "running" | "awaiting_approval";
  portfolio: Portfolio;
  agentMessages: { content: string; timestamp: string }[];
  tradeLog: TradeLogEntry[];
  strategyLog: StrategyLogEntry[];
  pendingChange: PendingStrategyChange | undefined;
  approve: (approved: boolean) => void;
}

function nowStr(): string {
  return new Date().toLocaleTimeString("es-AR", { hour12: false });
}

export function useLiveTrading(scenario: Scenario = "bull"): LiveTradingHook {
  const [status, setStatus] = useState<"running" | "awaiting_approval">("running");
  const [portfolio, setPortfolio] = useState<Portfolio>(() => getInitialPortfolio(scenario));
  const [agentMessages, setAgentMessages] = useState<{ content: string; timestamp: string }[]>([]);
  const [tradeLog, setTradeLog] = useState<TradeLogEntry[]>([]);
  const [strategyLog, setStrategyLog] = useState<StrategyLogEntry[]>([
    { type: "loaded", message: "Estrategia inicial cargada", timestamp: nowStr() },
  ]);
  const [pendingChange, setPendingChange] = useState<PendingStrategyChange | undefined>();
  const sessionRef = useRef<MockSession | null>(null);

  useEffect(() => {
    const session = startMockSession(scenario, (event) => {
      if (event.event === "agent_message") {
        setAgentMessages((prev) => [...prev, event.data]);
      } else if (event.event === "trade_executed") {
        setTradeLog((prev) => [event.data, ...prev]);
      } else if (event.event === "portfolio_update") {
        setPortfolio(event.data);
      } else if (event.event === "strategy_obsolete") {
        setPendingChange(event.data);
        setStatus("awaiting_approval");
        setStrategyLog((prev) => [
          ...prev,
          { type: "obsolete", message: "Agente detectó obsolescencia → esperando aprobación", timestamp: nowStr() },
        ]);
      }
    });
    sessionRef.current = session;
    return () => session.stop();
  }, [scenario]);

  const approve = useCallback((approved: boolean) => {
    sessionRef.current?.approve(approved);
    setPendingChange(undefined);
    setStatus("running");
    setStrategyLog((prev) => [
      ...prev,
      approved
        ? { type: "approved", message: "Usuario aprobó → nueva estrategia activa", timestamp: nowStr() }
        : { type: "rejected", message: "Usuario rechazó → se mantiene estrategia anterior", timestamp: nowStr() },
    ]);
  }, []);

  return { status, portfolio, agentMessages, tradeLog, strategyLog, pendingChange, approve };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useLiveTrading.ts
git commit -m "feat(live): add useLiveTrading hook"
```

---

## Task 4: MetricsRow

**Files:**
- Create: `frontend/src/components/live/MetricsRow.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/components/live/MetricsRow.tsx
"use client";

import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from "lucide-react";
import type { Portfolio } from "@/types/live";

interface MetricsRowProps {
  portfolio: Portfolio;
}

export function MetricsRow({ portfolio }: MetricsRowProps) {
  const { total_pnl, total_pnl_pct, daily_return, capital_at_risk, positions } = portfolio;
  const inProfit = positions.filter((p) => p.pnl_usd >= 0).length;
  const inLoss = positions.filter((p) => p.pnl_usd < 0).length;
  const pnlPositive = total_pnl >= 0;

  const cards = [
    {
      label: "PnL Total",
      value: `${pnlPositive ? "+" : ""}$${total_pnl.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`,
      sub: `${pnlPositive ? "+" : ""}${total_pnl_pct}%`,
      icon: pnlPositive ? TrendingUp : TrendingDown,
      color: pnlPositive ? "text-green-600" : "text-red-600",
      bg: pnlPositive ? "bg-green-50" : "bg-red-50",
    },
    {
      label: "Retorno Diario",
      value: `${daily_return >= 0 ? "+" : ""}${daily_return}%`,
      sub: "hoy",
      icon: daily_return >= 0 ? TrendingUp : TrendingDown,
      color: daily_return >= 0 ? "text-green-600" : "text-red-600",
      bg: daily_return >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      label: "Activos",
      value: `${inProfit} ↑ / ${inLoss} ↓`,
      sub: "en ganancia / pérdida",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Capital en Riesgo",
      value: `$${capital_at_risk.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`,
      sub: "pérdidas no realizadas",
      icon: capital_at_risk > 0 ? AlertTriangle : DollarSign,
      color: capital_at_risk > 500 ? "text-amber-600" : "text-zinc-600",
      bg: capital_at_risk > 500 ? "bg-amber-50" : "bg-zinc-50",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <p className="text-xs text-zinc-500">{card.label}</p>
          <p className={`text-lg font-semibold ${card.color} mt-1`}>{card.value}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/live/MetricsRow.tsx
git commit -m "feat(live): add MetricsRow component"
```

---

## Task 5: AllocationPie

**Files:**
- Create: `frontend/src/components/live/AllocationPie.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/components/live/AllocationPie.tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Portfolio } from "@/types/live";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

interface AllocationPieProps {
  portfolio: Portfolio;
}

export function AllocationPie({ portfolio }: AllocationPieProps) {
  const data = portfolio.allocation_pie.map((d) => ({ name: d.symbol, value: d.pct }));

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 flex-1">
      <h3 className="text-xs font-medium text-zinc-500 mb-3">Allocación del Portfolio</h3>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={52} paddingAngle={2} dataKey="value">
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs font-medium text-zinc-800">{d.name}</span>
              </div>
              <span className="text-xs text-zinc-500">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/live/AllocationPie.tsx
git commit -m "feat(live): add AllocationPie component"
```

---

## Task 6: GainsPie

**Files:**
- Create: `frontend/src/components/live/GainsPie.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/components/live/GainsPie.tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Portfolio } from "@/types/live";

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ef4444", "#ec4899"];

interface GainsPieProps {
  portfolio: Portfolio;
}

export function GainsPie({ portfolio }: GainsPieProps) {
  const raw = portfolio.gains_pie;
  // Only show positive gains in pie; show all in legend
  const positiveData = raw.filter((d) => d.gain > 0).map((d) => ({ name: d.symbol, value: d.gain }));
  const displayData = positiveData.length > 0 ? positiveData : [{ name: "–", value: 1 }];

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 flex-1">
      <h3 className="text-xs font-medium text-zinc-500 mb-3">Ganancia por Activo</h3>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={displayData} cx="50%" cy="50%" innerRadius={28} outerRadius={52} paddingAngle={2} dataKey="value">
                {displayData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `$${v.toFixed(0)}`} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5">
          {raw.map((d, i) => (
            <div key={d.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs font-medium text-zinc-800">{d.symbol}</span>
              </div>
              <span className={`text-xs font-semibold ${d.gain >= 0 ? "text-green-600" : "text-red-500"}`}>
                {d.gain >= 0 ? "+" : ""}${d.gain.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/live/GainsPie.tsx
git commit -m "feat(live): add GainsPie component"
```

---

## Task 7: PositionsTable

**Files:**
- Create: `frontend/src/components/live/PositionsTable.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/components/live/PositionsTable.tsx
"use client";

import type { Portfolio } from "@/types/live";

interface PositionsTableProps {
  portfolio: Portfolio;
}

const STATUS_STYLES: Record<string, string> = {
  BUY:  "bg-blue-100 text-blue-700",
  HOLD: "bg-zinc-100 text-zinc-600",
  SELL: "bg-red-100 text-red-600",
};

export function PositionsTable({ portfolio }: PositionsTableProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100">
        <h3 className="text-xs font-medium text-zinc-500">Posiciones Abiertas</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="text-left px-4 py-2 text-xs font-medium text-zinc-400">Activo</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-zinc-400">Entrada</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-zinc-400">Actual</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-zinc-400">PnL $</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-zinc-400">PnL %</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-zinc-400">Estado</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.positions.map((pos) => (
              <tr key={pos.symbol} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-2.5 font-semibold text-zinc-900">{pos.symbol}</td>
                <td className="px-4 py-2.5 text-right text-zinc-500">${pos.entry_price.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-right text-zinc-700 font-medium">${pos.current_price.toFixed(2)}</td>
                <td className={`px-4 py-2.5 text-right font-semibold ${pos.pnl_usd >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {pos.pnl_usd >= 0 ? "+" : ""}${pos.pnl_usd.toFixed(0)}
                </td>
                <td className={`px-4 py-2.5 text-right font-semibold ${pos.pnl_pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {pos.pnl_pct >= 0 ? "+" : ""}{pos.pnl_pct.toFixed(2)}%
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[pos.status]}`}>
                    {pos.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/live/PositionsTable.tsx
git commit -m "feat(live): add PositionsTable component"
```

---

## Task 8: PortfolioDashboard

**Files:**
- Create: `frontend/src/components/live/PortfolioDashboard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/components/live/PortfolioDashboard.tsx
"use client";

import { MetricsRow } from "./MetricsRow";
import { AllocationPie } from "./AllocationPie";
import { GainsPie } from "./GainsPie";
import { PositionsTable } from "./PositionsTable";
import type { Portfolio } from "@/types/live";

interface PortfolioDashboardProps {
  portfolio: Portfolio;
}

export function PortfolioDashboard({ portfolio }: PortfolioDashboardProps) {
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      <MetricsRow portfolio={portfolio} />
      <div className="flex gap-4">
        <AllocationPie portfolio={portfolio} />
        <GainsPie portfolio={portfolio} />
      </div>
      <PositionsTable portfolio={portfolio} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/live/PortfolioDashboard.tsx
git commit -m "feat(live): add PortfolioDashboard component"
```

---

## Task 9: AgentStream

**Files:**
- Create: `frontend/src/components/live/AgentStream.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/components/live/AgentStream.tsx
"use client";

import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";

interface AgentStreamProps {
  messages: { content: string; timestamp: string }[];
}

export function AgentStream({ messages }: AgentStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <h2 className="text-xs font-medium text-zinc-500">Razonamiento del Agente</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-zinc-400 italic">El agente está iniciando...</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3 h-3 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">{msg.timestamp}</p>
              <p className="text-sm text-zinc-700 leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/live/AgentStream.tsx
git commit -m "feat(live): add AgentStream component"
```

---

## Task 10: ActivityLog

**Files:**
- Create: `frontend/src/components/live/ActivityLog.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/components/live/ActivityLog.tsx
"use client";

import type { TradeLogEntry, StrategyLogEntry } from "@/types/live";

interface ActivityLogProps {
  tradeLog: TradeLogEntry[];
  strategyLog: StrategyLogEntry[];
}

const ACTION_STYLES: Record<string, string> = {
  BUY:  "text-blue-600 font-semibold",
  SELL: "text-red-500 font-semibold",
  HOLD: "text-zinc-400",
};

const STRATEGY_ICONS: Record<string, string> = {
  loaded:   "✓",
  obsolete: "⚠",
  approved: "✓",
  rejected: "✗",
};

const STRATEGY_COLORS: Record<string, string> = {
  loaded:   "text-green-600",
  obsolete: "text-amber-600",
  approved: "text-green-600",
  rejected: "text-red-500",
};

export function ActivityLog({ tradeLog, strategyLog }: ActivityLogProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Trade Log */}
      <div className="flex flex-col bg-white rounded-xl border border-zinc-200 overflow-hidden flex-1">
        <div className="px-4 py-3 border-b border-zinc-100">
          <h2 className="text-xs font-medium text-zinc-500">Trade Log</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 font-mono">
          {tradeLog.length === 0 && (
            <p className="text-xs text-zinc-400 italic font-sans">Sin operaciones aún...</p>
          )}
          {tradeLog.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-xs animate-in fade-in duration-200">
              <span className="text-zinc-400 shrink-0">{entry.timestamp}</span>
              <span className={ACTION_STYLES[entry.action]}>{entry.action}</span>
              <span className="text-zinc-700 font-semibold">{entry.symbol}</span>
              {entry.qty > 0 && <span className="text-zinc-500">x{entry.qty}</span>}
              {entry.price > 0 && <span className="text-zinc-400">@ ${entry.price.toFixed(2)}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Log */}
      <div className="flex flex-col bg-white rounded-xl border border-zinc-200 overflow-hidden flex-1">
        <div className="px-4 py-3 border-b border-zinc-100">
          <h2 className="text-xs font-medium text-zinc-500">Strategy Log</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {strategyLog.map((entry, i) => (
            <div key={i} className="flex gap-2 text-xs animate-in fade-in duration-200">
              <span className="text-zinc-400 shrink-0">[{entry.timestamp}]</span>
              <span className={STRATEGY_COLORS[entry.type]}>{STRATEGY_ICONS[entry.type]}</span>
              <span className="text-zinc-600">{entry.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/live/ActivityLog.tsx
git commit -m "feat(live): add ActivityLog component"
```

---

## Task 11: StrategyApprovalOverlay

**Files:**
- Create: `frontend/src/components/live/StrategyApprovalOverlay.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/components/live/StrategyApprovalOverlay.tsx
"use client";

import { AlertTriangle, Check, X } from "lucide-react";
import type { PendingStrategyChange } from "@/types/live";

interface StrategyApprovalOverlayProps {
  pending: PendingStrategyChange;
  onApprove: (approved: boolean) => void;
}

export function StrategyApprovalOverlay({ pending, onApprove }: StrategyApprovalOverlayProps) {
  return (
    <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">Trading pausado</h3>
            <p className="text-xs text-zinc-500">El agente detectó que la estrategia actual quedó obsoleta</p>
          </div>
        </div>

        <p className="text-sm text-zinc-600 mb-4 leading-relaxed">{pending.reason}</p>

        <div className="bg-zinc-50 rounded-xl p-4 mb-4 space-y-1.5">
          {pending.changes.map((change, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className={`font-mono text-xs mt-0.5 ${change.startsWith("+") ? "text-green-600" : change.startsWith("-") ? "text-red-500" : "text-zinc-400"}`}>
                {change.startsWith("+") ? "+" : change.startsWith("-") ? "−" : " "}
              </span>
              <span className="text-zinc-700">{change.replace(/^[+\-]\s*/, "")}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onApprove(false)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Rechazar — mantener actual
          </button>
          <button
            onClick={() => onApprove(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            Aprobar nueva estrategia
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/live/StrategyApprovalOverlay.tsx
git commit -m "feat(live): add StrategyApprovalOverlay component"
```

---

## Task 12: LiveLayout

**Files:**
- Create: `frontend/src/components/live/LiveLayout.tsx`

- [ ] **Step 1: Create the component**

```tsx
// frontend/src/components/live/LiveLayout.tsx
"use client";

import { AgentStream } from "./AgentStream";
import { PortfolioDashboard } from "./PortfolioDashboard";
import { ActivityLog } from "./ActivityLog";
import { StrategyApprovalOverlay } from "./StrategyApprovalOverlay";
import { useLiveTrading } from "@/hooks/useLiveTrading";
import type { Scenario } from "@/services/mockLiveTrading";

interface LiveLayoutProps {
  scenario?: Scenario;
}

export function LiveLayout({ scenario = "bull" }: LiveLayoutProps) {
  const { status, portfolio, agentMessages, tradeLog, strategyLog, pendingChange, approve } =
    useLiveTrading(scenario);

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-zinc-200 bg-white">
        <div className={`w-2 h-2 rounded-full ${status === "running" ? "bg-green-400 animate-pulse" : "bg-amber-400"}`} />
        <span className="text-sm text-zinc-600">
          {status === "running" ? "Live Trading activo" : "⚠ Trading pausado — esperando aprobación"}
        </span>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        {/* Left: Agent stream (25%) */}
        <div className="w-1/4 min-w-0">
          <AgentStream messages={agentMessages} />
        </div>

        {/* Center: Portfolio dashboard (50%) — relative for overlay */}
        <div className="flex-1 min-w-0 relative">
          <PortfolioDashboard portfolio={portfolio} />
          {status === "awaiting_approval" && pendingChange && (
            <StrategyApprovalOverlay pending={pendingChange} onApprove={approve} />
          )}
        </div>

        {/* Right: Activity log (25%) */}
        <div className="w-1/4 min-w-0">
          <ActivityLog tradeLog={tradeLog} strategyLog={strategyLog} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/live/LiveLayout.tsx
git commit -m "feat(live): add LiveLayout 3-column shell"
```

---

## Task 13: Route Page

**Files:**
- Create: `frontend/src/app/live/[strategyId]/page.tsx`

- [ ] **Step 1: Create the route**

```tsx
// frontend/src/app/live/[strategyId]/page.tsx
import { LiveLayout } from "@/components/live/LiveLayout";

interface LivePageProps {
  params: Promise<{ strategyId: string }>;
  searchParams: Promise<{ scenario?: string }>;
}

export default async function LivePage({ searchParams }: LivePageProps) {
  const { scenario } = await searchParams;
  const validScenario = ["bull", "rotation", "defensive"].includes(scenario ?? "")
    ? (scenario as "bull" | "rotation" | "defensive")
    : "bull";

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <LiveLayout scenario={validScenario} />
    </div>
  );
}
```

- [ ] **Step 2: Verify the route is accessible**

With the dev server running (`npm run dev` in `frontend/`), open:
```
http://localhost:3000/live/test123
```
Expected: 3-column layout renders, agent messages appear after ~8s, trades appear after ~4s.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/live/
git commit -m "feat(live): add /live/[strategyId] route"
```

---

## Task 14: Header + ApproveButton

**Files:**
- Modify: `frontend/src/components/layout/Header.tsx`
- Modify: `frontend/src/components/dashboard/ApproveButton.tsx`

- [ ] **Step 1: Update Header to add Live Trading link**

In `frontend/src/components/layout/Header.tsx`, replace the `<nav>` block:

```tsx
// Replace the existing <nav> block (lines 13-25) with:
      <nav className="flex items-center gap-4">
        <Link
          href="/app"
          className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Nueva Estrategia
        </Link>
        <Link
          href="/strategies"
          className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Mis Estrategias
        </Link>
        <Link
          href="/live/demo?scenario=rotation"
          className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-green-400" />
          Live Trading
        </Link>
      </nav>
```

- [ ] **Step 2: Update ApproveButton to add "Go Live" link**

In `frontend/src/components/dashboard/ApproveButton.tsx`, replace the approved state JSX:

```tsx
// Replace the approved state return (lines 24-30) with:
  if (status === "approved") {
    return (
      <div className="space-y-2 animate-in fade-in duration-300">
        <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700">
          <Check className="w-5 h-5" />
          <span className="font-medium">Estrategia aprobada y guardada</span>
        </div>
        <a
          href={`/live/${strategyId}?scenario=bull`}
          className="w-full py-3 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-green-400" />
          Abrir Live Trading
        </a>
      </div>
    );
  }
```

Also add the import for `Link` — replace the existing import line:
```tsx
import { Check, Loader2 } from "lucide-react";
```
No change needed — `<a>` tag is used instead of `Link` since we want a full navigation.

- [ ] **Step 3: Verify in browser**

Navigate to `/app`, submit a thesis, wait for the agent to finish, approve the strategy. Expected: "Abrir Live Trading" button appears below the approve confirmation.

Also verify the header shows "Live Trading" link with green dot.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Header.tsx
git add frontend/src/components/dashboard/ApproveButton.tsx
git commit -m "feat(live): add Live Trading entry points in Header and ApproveButton"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** 3-column layout ✓, MetricsRow ✓, AllocationPie ✓, GainsPie ✓, PositionsTable ✓, AgentStream ✓, TradeLog ✓, StrategyLog ✓, StrategyApprovalOverlay ✓, pause-on-obsolete ✓, approve/reject ✓, 3 mock scenarios ✓, nav entry points ✓, API contract types ✓
- [x] **No placeholders:** All code blocks are complete
- [x] **Type consistency:** `Portfolio`, `Position`, `TradeLogEntry`, `StrategyLogEntry`, `PendingStrategyChange` defined in Task 1 and used consistently in all subsequent tasks. `Scenario` type defined in mock service and imported in hook and layout.
