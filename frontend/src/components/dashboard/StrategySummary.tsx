"use client";

import { Shield, Target, RefreshCw, TrendingUp } from "lucide-react";

interface StrategySummaryProps {
  data: Record<string, unknown>;
}

/** Safely convert any value to a displayable number. */
function toNum(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") { const n = parseFloat(v); return isNaN(n) ? null : n; }
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    // Handle {percentage: 25, reasoning: "..."} shape
    if ("percentage" in obj) return toNum(obj.percentage);
    if ("value" in obj) return toNum(obj.value);
    if ("pct" in obj) return toNum(obj.pct);
  }
  return null;
}

/** Safely convert any value to a displayable string. */
function toStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

export function StrategySummary({ data }: StrategySummaryProps) {
  let allocations: Record<string, number> = {};
  let entryRules: Record<string, unknown> = {};
  let exitRules: Record<string, unknown> = {};
  let rebalance = "quarterly";

  try {
    const strategy = (
      data?.strategy || data?.strategy_params || data
    ) as Record<string, unknown> | null;
    if (!strategy || typeof strategy !== "object") return null;

    // Parse allocations — handle both {NVDA: 25} and {NVDA: {percentage: 25, reasoning: "..."}}
    const rawAlloc = strategy.allocations;
    if (rawAlloc && typeof rawAlloc === "object" && !Array.isArray(rawAlloc)) {
      for (const [key, val] of Object.entries(rawAlloc as Record<string, unknown>)) {
        const n = toNum(val);
        if (n !== null) allocations[key] = n;
      }
    }

    if (strategy.entry_rules && typeof strategy.entry_rules === "object") {
      entryRules = strategy.entry_rules as Record<string, unknown>;
    }
    if (strategy.exit_rules && typeof strategy.exit_rules === "object") {
      exitRules = strategy.exit_rules as Record<string, unknown>;
    }
    if (typeof strategy.rebalance_frequency === "string") {
      rebalance = strategy.rebalance_frequency;
    }
  } catch {
    return null;
  }

  const hasAllocations = Object.keys(allocations).length > 0;
  const hasRules = Object.keys(entryRules).length > 0 || Object.keys(exitRules).length > 0;

  if (!hasAllocations && !hasRules) return null;

  const rebalanceLabels: Record<string, string> = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    on_signal: "On signal",
    none: "No rebalancing",
  };

  return (
    <div className="glass rounded-2xl p-6 animate-in">
      <h3 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase mb-5">
        Defined Strategy
      </h3>

      {/* Allocations as horizontal bars */}
      {hasAllocations && (
        <div className="mb-5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Portfolio Allocation
          </p>
          <div className="space-y-2">
            {Object.entries(allocations)
              .sort(([, a], [, b]) => b - a)
              .map(([ticker, pct]) => (
                <div key={ticker} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white w-12">{ticker}</span>
                  <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-zinc-300 w-10 text-right">{pct}%</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Entry Rules */}
        {Object.keys(entryRules).length > 0 && (
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Target className="w-3 h-3 text-emerald-400" />
              Entry Rules
            </p>
            <div className="space-y-2">
              {entryRules.rsi_oversold != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">RSI Oversold</span>
                  <span className="text-zinc-300 font-medium">&lt; {toStr(entryRules.rsi_oversold)}</span>
                </div>
              )}
              {entryRules.require_above_sma200 != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Above SMA200</span>
                  <span className={`font-medium ${entryRules.require_above_sma200 ? "text-emerald-400" : "text-zinc-500"}`}>
                    {entryRules.require_above_sma200 ? "Required" : "No"}
                  </span>
                </div>
              )}
              {entryRules.macd_crossover != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">MACD Crossover</span>
                  <span className={`font-medium ${entryRules.macd_crossover ? "text-emerald-400" : "text-zinc-500"}`}>
                    {entryRules.macd_crossover ? "Required" : "No"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exit Rules */}
        {Object.keys(exitRules).length > 0 && (
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-red-400" />
              Exit Rules
            </p>
            <div className="space-y-2">
              {exitRules.stop_loss_pct != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Stop-Loss</span>
                  <span className="text-red-400 font-medium">{toStr(exitRules.stop_loss_pct)}%</span>
                </div>
              )}
              {exitRules.take_profit_pct != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Take-Profit</span>
                  <span className="text-emerald-400 font-medium">{toStr(exitRules.take_profit_pct)}%</span>
                </div>
              )}
              {exitRules.trailing_stop_pct != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Trailing Stop</span>
                  <span className="text-amber-400 font-medium">{toStr(exitRules.trailing_stop_pct)}%</span>
                </div>
              )}
              {exitRules.rsi_overbought != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">RSI Overbought</span>
                  <span className="text-zinc-300 font-medium">&gt; {toStr(exitRules.rsi_overbought)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rebalance frequency */}
      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
        <RefreshCw className="w-3 h-3" />
        <span>Rebalancing: <span className="text-zinc-300 font-medium">{rebalanceLabels[rebalance] || rebalance}</span></span>
      </div>
    </div>
  );
}
