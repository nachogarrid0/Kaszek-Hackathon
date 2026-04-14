"use client";

import type { TechnicalSignal } from "@/types";

interface TechnicalSignalsProps {
  signals: Record<string, TechnicalSignal>;
}

const SIGNAL_COLORS: Record<string, string> = {
  buy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sell: "bg-red-50 text-red-700 border-red-200",
  hold: "bg-amber-50 text-amber-700 border-amber-200",
};

const CONFLUENCE_COLORS: Record<string, string> = {
  strong: "bg-emerald-50 text-emerald-600 border-emerald-100",
  moderate: "bg-blue-50 text-blue-600 border-blue-100",
  weak: "bg-amber-50 text-amber-600 border-amber-100",
  conflict: "bg-red-50 text-red-600 border-red-100",
};

export function TechnicalSignals({ signals }: TechnicalSignalsProps) {
  return (
    <div className="bg-white rounded-2xl p-6 animate-in border border-zinc-200 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900 tracking-wide uppercase mb-5">
        Technical Signals
      </h3>

      <div className="space-y-3">
        {Object.entries(signals).map(([ticker, sig]) => (
          <div key={ticker} className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 transition-all hover:border-zinc-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900">{ticker}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${SIGNAL_COLORS[sig.signal] || "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                  {sig.signal.toUpperCase()}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CONFLUENCE_COLORS[sig.confluence] || "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                  {sig.confluence}
                </span>
              </div>
              <span className="text-sm font-bold text-zinc-900">${sig.current_price.toFixed(2)}</span>
            </div>

            {/* Signal strength bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-500">Signal strength</span>
                <span className="text-[10px] text-zinc-600">{(sig.signal_strength * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
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
              <div className="bg-white rounded-lg py-2 border border-zinc-200 shadow-sm">
                <p className="text-[10px] text-zinc-500 mb-0.5">RSI</p>
                <p className={`text-sm font-bold ${sig.rsi == null ? "text-zinc-600" :
                  sig.rsi > 70 ? "text-red-500" : sig.rsi < 30 ? "text-emerald-500" : "text-zinc-900"
                  }`}>
                  {sig.rsi != null ? sig.rsi.toFixed(1) : "-"}
                </p>
              </div>
              <div className="bg-white rounded-lg py-2 border border-zinc-200 shadow-sm">
                <p className="text-[10px] text-zinc-500 mb-0.5">MACD</p>
                <p className={`text-sm font-bold ${!sig.macd_signal ? "text-zinc-400" :
                  sig.macd_signal.includes("bullish") ? "text-emerald-500" :
                    sig.macd_signal.includes("bearish") ? "text-red-500" : "text-zinc-600"
                  }`}>
                  {!sig.macd_signal ? "-" :
                    sig.macd_signal.includes("bullish") ? "Bullish" :
                      sig.macd_signal.includes("bearish") ? "Bearish" : "Neutral"}
                </p>
              </div>
              <div className="bg-white rounded-lg py-2 border border-zinc-200 shadow-sm">
                <p className="text-[10px] text-zinc-500 mb-0.5">vs SMA200</p>
                <p className={`text-sm font-bold ${!sig.price_vs_sma200 ? "text-zinc-400" :
                  sig.price_vs_sma200 === "above" ? "text-emerald-500" : "text-red-500"
                  }`}>
                  {!sig.price_vs_sma200 ? "-" :
                    sig.price_vs_sma200 === "above" ? "Above" : "Below"}
                </p>
              </div>
              <div className="bg-white rounded-lg py-2 border border-zinc-200 shadow-sm">
                <p className="text-[10px] text-zinc-500 mb-0.5">Trend</p>
                <p className="text-sm font-bold text-zinc-900">
                  {sig.trend === "uptrend" ? "Uptrend" : sig.trend === "downtrend" ? "Downtrend" : "Sideways"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200 text-xs text-zinc-500">
              <span>Entry: <span className="text-zinc-900 font-medium">${sig.entry_zone.low.toFixed(2)} - ${sig.entry_zone.high.toFixed(2)}</span></span>
              <span>Stop: <span className="text-red-500 font-medium">${sig.stop_loss.toFixed(2)}</span></span>
              <span>Target: <span className="text-emerald-500 font-medium">${sig.targets[0]?.toFixed(2) || "N/A"}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
