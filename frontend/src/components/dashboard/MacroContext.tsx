"use client";

import type { MacroContext as MacroContextType } from "@/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MacroContextProps {
  data: MacroContextType;
}

const TREND_ICON = {
  rising: TrendingUp,
  falling: TrendingDown,
  stable: Minus,
};

const TREND_COLOR = {
  rising: "text-emerald-400",
  falling: "text-red-400",
  stable: "text-zinc-400",
};

const ALIGNMENT_COLORS: Record<string, string> = {
  strong: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  moderate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  weak: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  conflicting: "bg-red-500/10 text-red-400 border-red-500/20",
};

const CYCLE_LABELS: Record<string, string> = {
  expansion: "Expansion",
  peak: "Peak",
  contraction: "Contraction",
  trough: "Trough",
};

export function MacroContext({ data }: MacroContextProps) {
  const indicators = [
    { label: "Fed Rate", value: `${data.fed_rate.current}%`, trend: data.fed_rate.trend },
    { label: "CPI", value: `${data.cpi.current}%`, trend: data.cpi.trend },
    { label: "Treasury 10Y", value: `${data.treasury_10y.current}%`, trend: data.treasury_10y.trend },
  ];

  return (
    <div className="glass rounded-2xl p-6 animate-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase">
          Macro Context
        </h3>
        <div className="flex gap-2">
          <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {CYCLE_LABELS[data.cycle_phase] || data.cycle_phase}
          </span>
          <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${ALIGNMENT_COLORS[data.thesis_alignment] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
            Alignment: {data.thesis_alignment}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {indicators.map((ind) => {
          const Icon = TREND_ICON[ind.trend] || Minus;
          const color = TREND_COLOR[ind.trend] || "text-zinc-400";
          return (
            <div key={ind.label} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.04]">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{ind.label}</p>
                <p className="text-lg font-bold text-white mt-0.5">{ind.value}</p>
              </div>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
          );
        })}
      </div>

      {data.summary && (
        <p className="text-xs text-zinc-400 leading-relaxed">{data.summary}</p>
      )}
    </div>
  );
}
