"use client";

import type { SentimentAnalysis as SentimentType } from "@/types";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SentimentAnalysisProps {
  data: SentimentType;
}

const LABEL_COLORS: Record<string, string> = {
  Bullish: "bg-green-100 text-green-800",
  "Somewhat-Bullish": "bg-green-50 text-green-700",
  Neutral: "bg-zinc-100 text-zinc-600",
  "Somewhat-Bearish": "bg-red-50 text-red-700",
  Bearish: "bg-red-100 text-red-800",
};

const REGIME_CONFIG: Record<string, { label: string; color: string; icon: typeof TrendingUp }> = {
  risk_on: { label: "Risk On", color: "text-green-600", icon: TrendingUp },
  risk_off: { label: "Risk Off", color: "text-red-600", icon: TrendingDown },
  neutral: { label: "Neutral", color: "text-zinc-500", icon: Minus },
};

export function SentimentAnalysis({ data }: SentimentAnalysisProps) {
  const regime = REGIME_CONFIG[data.market_regime] || REGIME_CONFIG.neutral;
  const RegimeIcon = regime.icon;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 animate-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-500">Analisis de Sentimiento</h3>
        <div className="flex items-center gap-1.5">
          <RegimeIcon className={`w-4 h-4 ${regime.color}`} />
          <span className={`text-xs font-medium ${regime.color}`}>{regime.label}</span>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(data.ticker_sentiments).map(([ticker, sentiment]) => (
          <div key={ticker} className="bg-zinc-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-zinc-900">{ticker}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LABEL_COLORS[sentiment.label] || "bg-zinc-100 text-zinc-600"}`}>
                {sentiment.label}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-1.5">{sentiment.article_count} articulos analizados</p>
            {sentiment.top_headlines.length > 0 && (
              <ul className="space-y-1">
                {sentiment.top_headlines.slice(0, 3).map((headline, i) => (
                  <li key={i} className="text-xs text-zinc-600 truncate">
                    &bull; {headline}
                  </li>
                ))}
              </ul>
            )}
            {sentiment.catalyst_detected && sentiment.catalyst_description && (
              <div className="flex items-center gap-1.5 mt-2 text-amber-600">
                <AlertTriangle className="w-3 h-3" />
                <span className="text-xs font-medium">{sentiment.catalyst_description}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {data.risk_events.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <p className="text-xs font-medium text-zinc-500 mb-2">Eventos de riesgo</p>
          {data.risk_events.slice(0, 3).map((ev, i) => (
            <div key={i} className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-600">{ev.event}</span>
              <span className={`font-medium ${ev.impact === "high" ? "text-red-600" : ev.impact === "medium" ? "text-amber-600" : "text-zinc-400"}`}>
                {ev.date}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
