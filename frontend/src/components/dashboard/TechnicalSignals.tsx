"use client";

import type { TechnicalSignal } from "@/types";

interface TechnicalSignalsProps {
  signals: Record<string, TechnicalSignal>;
}

const SIGNAL_COLORS: Record<string, string> = {
  buy: "bg-green-100 text-green-800",
  sell: "bg-red-100 text-red-800",
  hold: "bg-amber-100 text-amber-800",
};

const CONFLUENCE_COLORS: Record<string, string> = {
  strong: "bg-green-50 text-green-700",
  moderate: "bg-blue-50 text-blue-700",
  weak: "bg-amber-50 text-amber-700",
  conflict: "bg-red-50 text-red-700",
};

export function TechnicalSignals({ signals }: TechnicalSignalsProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 animate-in">
      <h3 className="text-sm font-medium text-zinc-500 mb-4">Senales Tecnicas</h3>

      <div className="space-y-3">
        {Object.entries(signals).map(([ticker, sig]) => (
          <div key={ticker} className="bg-zinc-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900">{ticker}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SIGNAL_COLORS[sig.signal] || "bg-zinc-100"}`}>
                  {sig.signal.toUpperCase()}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${CONFLUENCE_COLORS[sig.confluence] || "bg-zinc-100"}`}>
                  {sig.confluence}
                </span>
              </div>
              <span className="text-sm font-medium text-zinc-700">${sig.current_price.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-xs text-zinc-400">RSI</p>
                <p className={`text-sm font-semibold ${sig.rsi > 70 ? "text-red-600" : sig.rsi < 30 ? "text-green-600" : "text-zinc-900"}`}>
                  {sig.rsi.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">MACD</p>
                <p className={`text-sm font-semibold ${sig.macd_signal.includes("bullish") ? "text-green-600" : sig.macd_signal.includes("bearish") ? "text-red-600" : "text-zinc-600"}`}>
                  {sig.macd_signal.includes("bullish") ? "Alcista" : sig.macd_signal.includes("bearish") ? "Bajista" : "Neutral"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">vs SMA200</p>
                <p className={`text-sm font-semibold ${sig.price_vs_sma200 === "above" ? "text-green-600" : "text-red-600"}`}>
                  {sig.price_vs_sma200 === "above" ? "Arriba" : "Abajo"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Tendencia</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {sig.trend === "uptrend" ? "Alcista" : sig.trend === "downtrend" ? "Bajista" : "Lateral"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-200 text-xs text-zinc-500">
              <span>Entrada: ${sig.entry_zone.low.toFixed(2)} - ${sig.entry_zone.high.toFixed(2)}</span>
              <span>Stop: ${sig.stop_loss.toFixed(2)}</span>
              <span>Target: ${sig.targets[0]?.toFixed(2) || "N/A"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
