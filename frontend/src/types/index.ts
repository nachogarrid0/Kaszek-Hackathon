// --- Chat ---
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "thinking";
  content: string;
  timestamp: number;
}

// --- Clarification ---
export interface ClarificationQuestion {
  id: string;
  question: string;
  type: "select" | "number" | "text";
  options?: string[];
  placeholder?: string;
  required: boolean;
}

export interface ClarificationResponse {
  session_id: string;
  thesis: string;
  intro_message: string;
  questions: ClarificationQuestion[];
}

// --- Macro Context ---
export interface MacroIndicator {
  current: number;
  trend: "rising" | "falling" | "stable";
}

export interface MacroContext {
  fed_rate: MacroIndicator;
  cpi: MacroIndicator;
  treasury_10y: MacroIndicator;
  cycle_phase: "expansion" | "peak" | "contraction" | "trough";
  thesis_alignment: "strong" | "moderate" | "weak" | "conflicting";
  summary: string;
}

// --- Assets Selected ---
export interface AssetSelected {
  ticker: string;
  name: string;
  sector: string;
  allocation_pct: number;
  fundamental_bias: "bullish" | "bearish" | "neutral";
  pe_ratio: number | null;
  revenue_growth_yoy: string;
  profit_margin: string;
  analyst_consensus: string;
  reasoning: string;
}

// --- Sentiment ---
export interface TickerSentiment {
  label: string;
  article_count: number;
  top_headlines: string[];
  catalyst_detected: boolean;
  catalyst_description: string | null;
}

export interface RiskEvent {
  date: string;
  event: string;
  impact: "high" | "medium" | "low";
}

export interface SentimentAnalysis {
  ticker_sentiments: Record<string, TickerSentiment>;
  market_regime: "risk_on" | "risk_off" | "neutral";
  risk_events: RiskEvent[];
}

// --- Technical Signals ---
export interface TechnicalSignal {
  trend: "uptrend" | "downtrend" | "sideways";
  signal: "buy" | "sell" | "hold";
  signal_strength: number;
  confluence: "strong" | "moderate" | "weak" | "conflict";
  rsi: number;
  macd_signal: string;
  price_vs_sma200: "above" | "below";
  bollinger_position: "upper" | "middle" | "lower";
  entry_zone: { low: number; high: number };
  stop_loss: number;
  targets: number[];
  current_price: number;
  atr: number;
}

// --- Backtest Result ---
export interface BacktestPerformance {
  total_return_pct: number;
  cagr_pct: number;
  max_drawdown_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  win_rate_pct: number;
  profit_factor: number;
  best_month_pct: number;
  worst_month_pct: number;
}

export interface BenchmarkComparison {
  spy_total_return_pct: number;
  spy_sharpe: number;
  alpha_pct: number;
  beta: number;
}

export interface RegimePerformance {
  return_pct: number;
  trading_days: number;
}

export interface EquityCurvePoint {
  date: string;
  portfolio: number;
  benchmark?: number;
}

export interface MonthlyReturn {
  month: string;
  return_pct: number;
}

export interface BacktestResult {
  performance: BacktestPerformance;
  benchmark_comparison: BenchmarkComparison;
  regime_performance: Record<string, RegimePerformance>;
  equity_curve: EquityCurvePoint[];
  monthly_returns: MonthlyReturn[];
  period?: { start: string; end: string; trading_days: number };
}

// --- Strategy ---
export interface Strategy {
  id: string;
  thesis: string;
  status: string;
  approved: boolean;
  created_at?: string;
  macro_context?: MacroContext;
  assets?: AssetSelected[];
  sentiment?: SentimentAnalysis;
  technical_signals?: Record<string, TechnicalSignal>;
  backtest_result?: BacktestResult;
}

// --- SSE Events ---
export type SSEEventType =
  | "session_start"
  | "thinking"
  | "chat_message"
  | "dashboard_update"
  | "done"
  | "error";

export type DashboardUpdateType =
  | "macro_context"
  | "assets_selected"
  | "sentiment_analysis"
  | "technical_signals"
  | "backtest_result"
  | "final_strategy";

export type AppPhase = "idle" | "clarifying" | "answering" | "analyzing";
