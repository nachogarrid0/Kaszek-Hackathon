import type {
  LiveEvent,
  Portfolio,
  Position,
  PendingStrategyChange,
} from "@/types/live";
import type { StrategyParams } from "@/types";

export type Scenario = "bull" | "rotation" | "defensive";

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

const BULL_POSITIONS_INIT: Position[] = [
  { symbol: "AAPL", entry_price: 182.4,  current_price: 191.2,  pnl_usd: 880,   pnl_pct: 4.83,  status: "HOLD", quantity: 100 },
  { symbol: "MSFT", entry_price: 415.0,  current_price: 424.8,  pnl_usd: 980,   pnl_pct: 2.36,  status: "HOLD", quantity: 100 },
  { symbol: "NVDA", entry_price: 875.8,  current_price: 921.5,  pnl_usd: 4570,  pnl_pct: 5.22,  status: "BUY",  quantity: 100 },
  { symbol: "GOOGL",entry_price: 174.3,  current_price: 179.1,  pnl_usd: 480,   pnl_pct: 2.75,  status: "HOLD", quantity: 100 },
  { symbol: "META", entry_price: 512.4,  current_price: 531.0,  pnl_usd: 1860,  pnl_pct: 3.63,  status: "HOLD", quantity: 100 },
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
  { action: "BUY",  symbol: "NVDA",  qty: 10, price: 921.5 },
  { action: "HOLD", symbol: "AAPL",  qty: 0,  price: 191.2 },
  { action: "HOLD", symbol: "META",  qty: 0,  price: 531.0 },
  { action: "BUY",  symbol: "MSFT",  qty: 5,  price: 424.8 },
  { action: "SELL", symbol: "GOOGL", qty: 10, price: 179.1 },
  { action: "BUY",  symbol: "NVDA",  qty: 5,  price: 928.3 },
];

const ROTATION_POSITIONS_INIT: Position[] = [
  { symbol: "AAPL", entry_price: 182.4, current_price: 187.1, pnl_usd: 470,   pnl_pct: 2.58,  status: "HOLD", quantity: 100 },
  { symbol: "TSLA", entry_price: 241.1, current_price: 228.4, pnl_usd: -1270, pnl_pct: -5.27, status: "SELL", quantity: 100 },
  { symbol: "AMZN", entry_price: 184.2, current_price: 189.0, pnl_usd: 480,   pnl_pct: 2.61,  status: "HOLD", quantity: 100 },
  { symbol: "MSFT", entry_price: 415.0, current_price: 408.5, pnl_usd: -650,  pnl_pct: -1.57, status: "SELL", quantity: 100 },
  { symbol: "META", entry_price: 512.4, current_price: 504.1, pnl_usd: -830,  pnl_pct: -1.62, status: "HOLD", quantity: 100 },
];

const ROTATION_OLD_STRATEGY: StrategyParams = {
  assets: ROTATION_POSITIONS_INIT.map((p) => ({ symbol: p.symbol, allocation: 20 })),
  stop_loss: 0.03,
  take_profit: 0.12,
  rebalance_frequency: "weekly",
};

const ROTATION_NEW_STRATEGY: StrategyParams = {
  assets: [
    { symbol: "NVDA",  allocation: 25 },
    { symbol: "AMZN",  allocation: 25 },
    { symbol: "AAPL",  allocation: 20 },
    { symbol: "GLD",   allocation: 15 },
    { symbol: "BRK.B", allocation: 15 },
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

const DEFENSIVE_POSITIONS_INIT: Position[] = [
  { symbol: "AAPL",  entry_price: 182.4, current_price: 184.1, pnl_usd: 170, pnl_pct: 0.93, status: "HOLD", quantity: 100 },
  { symbol: "JNJ",   entry_price: 147.5, current_price: 149.8, pnl_usd: 230, pnl_pct: 1.56, status: "HOLD", quantity: 100 },
  { symbol: "PG",    entry_price: 168.2, current_price: 170.5, pnl_usd: 230, pnl_pct: 1.37, status: "HOLD", quantity: 100 },
  { symbol: "GLD",   entry_price: 182.3, current_price: 188.4, pnl_usd: 610, pnl_pct: 3.35, status: "BUY",  quantity: 100 },
  { symbol: "BRK.B", entry_price: 365.0, current_price: 371.2, pnl_usd: 620, pnl_pct: 1.70, status: "HOLD", quantity: 100 },
];

const DEFENSIVE_AGENT_MESSAGES = [
  "Estrategia defensiva de largo plazo activa. Foco en preservación de capital.",
  "GLD mostrando apreciación sostenida. El contexto macro favorece el oro.",
  "JNJ y PG como anclas defensivas. Baja correlación con el mercado general.",
  "BRK.B diversifica exposición sin aumentar volatilidad del portfolio.",
  "El ratio de Sharpe del portfolio se mantiene por encima de 1.2. Muy saludable.",
  "Revisando la estrategia frente al cambio en tasas de interés. Ajuste menor requerido.",
];

export interface MockSession {
  stop: () => void;
  approve: (approved: boolean) => void;
}

export function startMockSession(
  scenario: Scenario,
  onEvent: (event: LiveEvent) => void
): MockSession {
  const intervals: ReturnType<typeof setInterval>[] = [];
  const timeouts: ReturnType<typeof setTimeout>[] = [];
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

  const msgInterval = setInterval(() => {
    if (stopped || awaitingApproval) return;
    const content = agentMessages[msgIdx % agentMessages.length];
    msgIdx++;
    onEvent({ event: "agent_message", data: { content, timestamp: ts() } });
  }, 8000);
  intervals.push(msgInterval);

  if (scenario === "bull" && trades.length > 0) {
    const tradeInterval = setInterval(() => {
      if (stopped || awaitingApproval) return;
      const t = trades[tradeIdx % trades.length];
      tradeIdx++;
      onEvent({ event: "trade_executed", data: { ...t, timestamp: ts() } });
      positions = positions.map((p) => {
        const shift = (Math.random() - 0.45) * 1.5;
        return delta(p, parseFloat(shift.toFixed(2)));
      });
      onEvent({ event: "portfolio_update", data: buildPortfolio(positions) });
    }, 4000);
    intervals.push(tradeInterval);
  }

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

  if (scenario === "rotation") {
    const obsoleteTimeout = setTimeout(() => {
      if (stopped) return;
      awaitingApproval = true;
      onEvent({ event: "strategy_obsolete", data: ROTATION_PENDING });
    }, 30000);
    timeouts.push(obsoleteTimeout);
  }

  return {
    stop() {
      stopped = true;
      intervals.forEach(clearInterval);
      timeouts.forEach(clearTimeout);
    },
    approve(approved: boolean) {
      awaitingApproval = false;
      if (approved) {
        positions = [
          { symbol: "NVDA",  entry_price: 875.8, current_price: 890.0, pnl_usd: 1420, pnl_pct: 1.62, status: "BUY",  quantity: 100 },
          { symbol: "AMZN",  entry_price: 184.2, current_price: 189.0, pnl_usd: 480,  pnl_pct: 2.61, status: "HOLD", quantity: 100 },
          { symbol: "AAPL",  entry_price: 182.4, current_price: 187.1, pnl_usd: 470,  pnl_pct: 2.58, status: "HOLD", quantity: 100 },
          { symbol: "GLD",   entry_price: 182.3, current_price: 186.0, pnl_usd: 370,  pnl_pct: 2.03, status: "BUY",  quantity: 100 },
          { symbol: "BRK.B", entry_price: 365.0, current_price: 371.2, pnl_usd: 620,  pnl_pct: 1.70, status: "HOLD", quantity: 100 },
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
