"use client";

import type { SentimentAnalysis as SentimentType } from "@/types";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SentimentAnalysisProps {
  data: SentimentType;
}

const LABEL_COLORS: Record<string, string> = {
  Bullish: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Somewhat-Bullish": "bg-emerald-500/10 text-emerald-300 border-emerald-500/15",
  Neutral: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  "Somewhat-Bearish": "bg-red-500/10 text-red-300 border-red-500/15",
  Bearish: "bg-red-500/10 text-red-400 border-red-500/20",
};

const REGIME_CONFIG: Record<string, { label: string; color: string; icon: typeof TrendingUp }> = {
  risk_on: { label: "Risk On", color: "text-emerald-400", icon: TrendingUp },
  risk_off: { label: "Risk Off", color: "text-red-400", icon: TrendingDown },
  neutral: { label: "Neutral", color: "text-zinc-400", icon: Minus },
};

export function SentimentAnalysis({ data }: SentimentAnalysisProps) {
  const regime = REGIME_CONFIG[data.market_regime] || REGIME_CONFIG.neutral;
  const RegimeIcon = regime.icon;

  return (
    <div className="glass rounded-2xl p-6 animate-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">
          Sentiment Analysis
        </h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
          <RegimeIcon className={`w-3.5 h-3.5 ${regime.color}`} />
          <span className={`text-[10px] font-medium ${regime.color}`}>{regime.label}</span>
        </div>
      </div>

      <div className="space-y-3">
        {Object.entries(data.ticker_sentiments).map(([ticker, sentiment]) => (
          <div key={ticker} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04] transition-all hover:border-white/[0.08]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-bold text-white">{ticker}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${LABEL_COLORS[sentiment.label] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
                {sentiment.label}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mb-2">{sentiment.article_count} articles analyzed</p>
            {sentiment.top_headlines.length > 0 && (
              <ul className="space-y-1.5">
                {sentiment.top_headlines.slice(0, 3).map((headline, i) => (
                  <li key={i} className="text-xs text-zinc-400 truncate flex items-start gap-1.5">
                    <span className="text-zinc-600 mt-0.5">•</span>
                    <span>{headline}</span>
                  </li>
                ))}
              </ul>
            )}
            {sentiment.catalyst_detected && sentiment.catalyst_description && (
              <div className="flex items-center gap-1.5 mt-3 text-amber-400 bg-amber-500/5 rounded-lg px-3 py-2 border border-amber-500/10">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs font-medium">{sentiment.catalyst_description}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {data.risk_events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Risk events</p>
          {data.risk_events.slice(0, 3).map((ev, i) => (
            <div key={i} className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-400">{ev.event}</span>
              <span className={`font-medium ${ev.impact === "high" ? "text-red-400" : ev.impact === "medium" ? "text-amber-400" : "text-zinc-500"}`}>
                {ev.date}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
