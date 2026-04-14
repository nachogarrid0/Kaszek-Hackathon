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
