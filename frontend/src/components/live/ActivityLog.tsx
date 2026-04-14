"use client";

import type { TradeLogEntry, StrategyLogEntry } from "@/types/live";

interface ActivityLogProps {
  tradeLog: TradeLogEntry[];
  strategyLog: StrategyLogEntry[];
}

const ACTION_STYLES: Record<string, string> = {
  BUY: "text-emerald-400 font-semibold",
  SELL: "text-red-400 font-semibold",
  HOLD: "text-zinc-500",
};

const STRATEGY_ICONS: Record<string, string> = {
  loaded: "✓",
  obsolete: "⚠",
  approved: "✓",
  rejected: "✗",
};

const STRATEGY_COLORS: Record<string, string> = {
  loaded: "text-emerald-400",
  obsolete: "text-amber-400",
  approved: "text-emerald-400",
  rejected: "text-red-400",
};

export function ActivityLog({ tradeLog, strategyLog }: ActivityLogProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col glass rounded-2xl border border-white/[0.08] overflow-hidden flex-1">
        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Trade Log</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 font-mono">
          {tradeLog.length === 0 && (
            <p className="text-sm text-zinc-600 italic font-sans">Sin operaciones aún...</p>
          )}
          {tradeLog.map((entry, i) => (
            <div key={`${entry.timestamp}-${entry.symbol}-${i}`} className="flex items-center gap-2.5 text-xs animate-in fade-in duration-200">
              <span className="text-zinc-600 shrink-0 select-none">[{entry.timestamp}]</span>
              <span className={`w-8 text-center ${ACTION_STYLES[entry.action]}`}>{entry.action}</span>
              <span className="text-zinc-200 font-semibold">{entry.symbol}</span>
              {entry.qty > 0 && <span className="text-zinc-500">x{entry.qty}</span>}
              {entry.price > 0 && <span className="text-zinc-500">@ ${entry.price.toFixed(2)}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col glass rounded-2xl border border-white/[0.08] overflow-hidden flex-1 shadow-inner">
        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Strategy Log</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {strategyLog.map((entry, i) => (
            <div key={i} className="flex gap-3 text-xs animate-in fade-in duration-200">
              <span className="text-zinc-600 shrink-0 font-mono select-none">[{entry.timestamp}]</span>
              <span className={`${STRATEGY_COLORS[entry.type]} font-bold`}>{STRATEGY_ICONS[entry.type]}</span>
              <span className="text-zinc-300 leading-relaxed">{entry.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
