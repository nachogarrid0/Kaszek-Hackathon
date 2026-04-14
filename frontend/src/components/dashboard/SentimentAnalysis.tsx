"use client";

import type { SentimentAnalysis as SentimentType } from "@/types";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SentimentAnalysisProps {
  data: SentimentType;
}

const LABEL_COLORS: Record<string, string> = {
  Bullish: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Somewhat-Bullish": "bg-emerald-50 text-emerald-600 border-emerald-100",
  Neutral: "bg-zinc-100 text-zinc-600 border-zinc-200",
  "Somewhat-Bearish": "bg-red-50 text-red-600 border-red-100",
  Bearish: "bg-red-50 text-red-700 border-red-200",
};

const REGIME_CONFIG: Record<string, { label: string; color: string; icon: typeof TrendingUp }> = {
  risk_on: { label: "Risk On", color: "text-emerald-600", icon: TrendingUp },
  risk_off: { label: "Risk Off", color: "text-red-600", icon: TrendingDown },
  neutral: { label: "Neutral", color: "text-zinc-500", icon: Minus },
};

export function SentimentAnalysis({ data }: SentimentAnalysisProps) {
  const regime = REGIME_CONFIG[data.market_regime] || REGIME_CONFIG.neutral;
  const RegimeIcon = regime.icon;

  return (
    <div className="bg-white rounded-2xl p-6 animate-in border border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-zinc-900 tracking-wide uppercase">
          Sentiment Analysis
        </h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-50 border border-zinc-200">
          <RegimeIcon className={`w-3.5 h-3.5 ${regime.color}`} />
          <span className={`text-[10px] font-medium ${regime.color}`}>{regime.label}</span>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(data.ticker_sentiments).map(([ticker, sentiment]) => (
          <div key={ticker} className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 transition-all hover:border-zinc-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-bold text-zinc-900">{ticker}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${LABEL_COLORS[sentiment.label] || "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                {sentiment.label}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mb-2">{sentiment.article_count} articles analyzed</p>
            {sentiment.top_headlines.length > 0 && (
              <ul className="space-y-1.5">
                {sentiment.top_headlines.slice(0, 3).map((headline, i) => (
                  <li key={i} className="text-xs text-zinc-600 truncate flex items-start gap-1.5">
                    <span className="text-zinc-400 mt-0.5">•</span>
                    <span>{headline}</span>
                  </li>
                ))}
              </ul>
            )}
            {sentiment.catalyst_detected && sentiment.catalyst_description && (
              <div className="flex items-center gap-1.5 mt-3 text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs font-medium">{sentiment.catalyst_description}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {data.risk_events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Risk events</p>
          {data.risk_events.slice(0, 3).map((ev, i) => (
            <div key={i} className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-600">{ev.event}</span>
              <span className={`font-medium ${ev.impact === "high" ? "text-red-600" : ev.impact === "medium" ? "text-amber-600" : "text-zinc-500"}`}>
                {ev.date}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
