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
      <div className="flex flex-col bg-white rounded-xl border border-zinc-200 overflow-hidden flex-1">
        <div className="px-4 py-3 border-b border-zinc-100">
          <h2 className="text-xs font-medium text-zinc-500">Trade Log</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 font-mono">
          {tradeLog.length === 0 && (
            <p className="text-xs text-zinc-400 italic font-sans">Sin operaciones aún...</p>
          )}
          {tradeLog.map((entry, i) => (
            <div key={`${entry.timestamp}-${entry.symbol}-${i}`} className="flex items-center gap-2 text-xs animate-in fade-in duration-200">
              <span className="text-zinc-400 shrink-0">{entry.timestamp}</span>
              <span className={ACTION_STYLES[entry.action]}>{entry.action}</span>
              <span className="text-zinc-700 font-semibold">{entry.symbol}</span>
              {entry.qty > 0 && <span className="text-zinc-500">x{entry.qty}</span>}
              {entry.price > 0 && <span className="text-zinc-400">@ ${entry.price.toFixed(2)}</span>}
            </div>
          ))}
        </div>
      </div>

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
