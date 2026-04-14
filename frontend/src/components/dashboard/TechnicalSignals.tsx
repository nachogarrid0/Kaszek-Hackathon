"use client";

import type { TechnicalSignal } from "@/types";

interface TechnicalSignalsProps {
  signals: Record<string, TechnicalSignal>;
}

const SIGNAL_COLORS: Record<string, string> = {
  buy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  sell: "bg-red-500/10 text-red-400 border-red-500/20",
  hold: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const CONFLUENCE_COLORS: Record<string, string> = {
  strong: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
  moderate: "bg-blue-500/10 text-blue-400 border-blue-500/15",
  weak: "bg-amber-500/10 text-amber-400 border-amber-500/15",
  conflict: "bg-red-500/10 text-red-400 border-red-500/15",
};

export function TechnicalSignals({ signals }: TechnicalSignalsProps) {
  return (
    <div className="glass rounded-2xl p-6 animate-in">
      <h3 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase mb-5">
        Señales Técnicas
      </h3>

      <div className="space-y-3">
        {Object.entries(signals).map(([ticker, sig]) => (
          <div key={ticker} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04] transition-all hover:border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{ticker}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${SIGNAL_COLORS[sig.signal] || "bg-zinc-500/10"}`}>
                  {sig.signal.toUpperCase()}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CONFLUENCE_COLORS[sig.confluence] || "bg-zinc-500/10"}`}>
                  {sig.confluence}
                </span>
              </div>
              <span className="text-sm font-bold text-white">${sig.current_price.toFixed(2)}</span>
            </div>

            {/* Signal strength bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-500">Fuerza de señal</span>
                <span className="text-[10px] text-zinc-400">{(sig.signal_strength * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${sig.signal_strength * 100}%`,
                    background: sig.signal_strength > 0.7
                      ? "linear-gradient(90deg, #10b981, #34d399)"
                      : sig.signal_strength > 0.4
                        ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
                        : "linear-gradient(90deg, #f59e0b, #fbbf24)",
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-white/[0.02] rounded-lg py-2">
                <p className="text-[10px] text-zinc-500 mb-0.5">RSI</p>
                <p className={`text-sm font-bold ${sig.rsi > 70 ? "text-red-400" : sig.rsi < 30 ? "text-emerald-400" : "text-white"}`}>
                  {sig.rsi.toFixed(1)}
                </p>
              </div>
              <div className="bg-white/[0.02] rounded-lg py-2">
                <p className="text-[10px] text-zinc-500 mb-0.5">MACD</p>
                <p className={`text-sm font-bold ${sig.macd_signal.includes("bullish") ? "text-emerald-400" : sig.macd_signal.includes("bearish") ? "text-red-400" : "text-zinc-400"}`}>
                  {sig.macd_signal.includes("bullish") ? "Alcista" : sig.macd_signal.includes("bearish") ? "Bajista" : "Neutral"}
                </p>
              </div>
              <div className="bg-white/[0.02] rounded-lg py-2">
                <p className="text-[10px] text-zinc-500 mb-0.5">vs SMA200</p>
                <p className={`text-sm font-bold ${sig.price_vs_sma200 === "above" ? "text-emerald-400" : "text-red-400"}`}>
                  {sig.price_vs_sma200 === "above" ? "Arriba" : "Abajo"}
                </p>
              </div>
              <div className="bg-white/[0.02] rounded-lg py-2">
                <p className="text-[10px] text-zinc-500 mb-0.5">Tendencia</p>
                <p className="text-sm font-bold text-white">
                  {sig.trend === "uptrend" ? "Alcista" : sig.trend === "downtrend" ? "Bajista" : "Lateral"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04] text-xs text-zinc-500">
              <span>Entrada: <span className="text-zinc-300">${sig.entry_zone.low.toFixed(2)} - ${sig.entry_zone.high.toFixed(2)}</span></span>
              <span>Stop: <span className="text-red-400">${sig.stop_loss.toFixed(2)}</span></span>
              <span>Target: <span className="text-emerald-400">${sig.targets[0]?.toFixed(2) || "N/A"}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
