// --- Chat ---
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "thinking";
  content: string;
  timestamp: number;
}

// --- Dashboard ---
export interface Asset {
  symbol: string;
  name?: string;
  allocation: number;
  reason?: string;
}

export interface Metrics {
  total_return: number;
  annualized_return: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  volatility: number;
  win_rate: number;
  total_days: number;
  final_value: number;
  initial_capital?: number;
}

export interface EquityCurve {
  dates: string[];
  values: number[];
}

export interface BenchmarkComparison {
  strategy: Metrics;
  benchmark: {
    symbol: string;
    metrics: Metrics;
    equity_curve: EquityCurve;
  };
  comparison: {
    excess_return: number;
    sharpe_diff: number;
    beats_benchmark: boolean;
  };
}

export interface StrategyParams {
  assets?: Asset[];
  stop_loss?: number | null;
  take_profit?: number | null;
  rebalance_frequency?: string;
}

export interface Strategy {
  id: string;
  thesis: string;
  status: string;
  approved: boolean;
  created_at?: string;
  assets?: Asset[];
  metrics?: Metrics;
  equity_curve?: EquityCurve;
  strategy_params?: StrategyParams;
  benchmark_comparison?: BenchmarkComparison;
  reasoning?: string;
}

// --- SSE Events ---
export type SSEEventType =
  | "session_start"
  | "thinking"
  | "chat_message"
  | "dashboard_update"
  | "done"
  | "error";

export interface SSEEvent {
  event: SSEEventType;
  data: Record<string, unknown>;
}

export interface DashboardUpdate {
  type: "assets" | "metrics" | "equity_curve" | "benchmark" | "strategy_params" | "strategy_complete";
  data: Record<string, unknown>;
}
