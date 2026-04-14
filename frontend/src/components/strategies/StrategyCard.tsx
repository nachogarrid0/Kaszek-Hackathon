"use client";

import { useState } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Clock, AlertTriangle, Check, X } from "lucide-react";

interface StrategyStep {
  tool: string;
  status: string;
  timestamp: string;
  duration_ms: number;
  input_preview: string;
  result_preview: string;
  error?: string | null;
}

interface StrategyData {
  id: string;
  thesis: string;
  status: string;
  approved: boolean;
  created_at?: string;
  assets?: { ticker: string }[];
  metrics?: {
    total_return_pct?: number;
    sharpe_ratio?: number;
    max_drawdown_pct?: number;
  };
  steps?: StrategyStep[];
}

interface StrategyCardProps {
  strategy: StrategyData;
}

const TOOL_LABELS: Record<string, string> = {
  get_economic_indicators: "Macro Indicators",
  get_company_overview: "Fundamentals",
  get_news_sentiment: "Sentiment",
  get_price_history: "Price Data",
  get_technical_indicators: "Technical Indicators",
  run_backtest: "Backtest",
  update_dashboard: "Dashboard Update",
};

export function StrategyCard({ strategy }: StrategyCardProps) {
  const [showSteps, setShowSteps] = useState(false);
  const perf = strategy.metrics;
  const isPositive = (perf?.total_return_pct ?? 0) >= 0;
  const steps = strategy.steps || [];
  const errorSteps = steps.filter((s) => s.status === "error");
  const totalDuration = steps.reduce((sum, s) => sum + (s.duration_ms || 0), 0);

  return (
    <div className="glass rounded-2xl p-5 hover:border-white/[0.12] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm text-white font-medium line-clamp-2">
            &ldquo;{strategy.thesis}&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-[10px] text-zinc-500">
              {strategy.created_at
                ? new Date(strategy.created_at).toLocaleDateString("es", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }, "en")
                : ""}
            </p>
            {steps.length > 0 && (
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {(totalDuration / 1000).toFixed(1)}s · {steps.length} steps
              </span>
            )}
            {errorSteps.length > 0 && (
              <span className="text-[10px] text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                {errorSteps.length} error{errorSteps.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        {strategy.approved && (
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 ml-2" />
        )}
      </div>

      {perf && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="bg-white/[0.03] rounded-lg px-3 py-2">
            <p className="text-[10px] text-zinc-500">Return</p>
            <p
              className={`text-sm font-bold ${isPositive ? "text-emerald-400" : "text-red-400"
                }`}
            >
              {isPositive ? "+" : ""}
              {perf.total_return_pct}%
            </p>
          </div>
          <div className="bg-white/[0.03] rounded-lg px-3 py-2">
            <p className="text-[10px] text-zinc-500">Sharpe</p>
            <p className="text-sm font-bold text-white">{perf.sharpe_ratio}</p>
          </div>
          <div className="bg-white/[0.03] rounded-lg px-3 py-2">
            <p className="text-[10px] text-zinc-500">Drawdown</p>
            <p className="text-sm font-bold text-white">
              {perf.max_drawdown_pct}%
            </p>
          </div>
        </div>
      )}

      {strategy.assets && strategy.assets.length > 0 && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {strategy.assets.map((a) => (
            <span
              key={a.ticker}
              className="text-[10px] bg-white/[0.05] text-zinc-400 px-2 py-0.5 rounded-full border border-white/[0.06]"
            >
              {a.ticker}
            </span>
          ))}
        </div>
      )}

      {/* Step log toggle */}
      {steps.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showSteps ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {showSteps ? "Hide" : "View"} execution log ({steps.length}{" "}
            steps)
          </button>

          {showSteps && (
            <div className="mt-2 space-y-1">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-[10px] px-3 py-1.5 rounded-lg ${step.status === "error"
                      ? "bg-red-500/5 border border-red-500/10"
                      : "bg-white/[0.02]"
                    }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {step.status === "ok" ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <X className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-300">
                        {TOOL_LABELS[step.tool] || step.tool}
                      </span>
                      <span className="text-zinc-600 ml-2">
                        {step.duration_ms}ms
                      </span>
                    </div>
                    {step.status === "error" && step.error && (
                      <p className="text-red-400 mt-0.5 truncate">
                        {step.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
