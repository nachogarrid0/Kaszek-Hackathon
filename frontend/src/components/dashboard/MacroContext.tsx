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
  rising: "text-green-600",
  falling: "text-red-600",
  stable: "text-zinc-500",
};

const ALIGNMENT_COLORS: Record<string, string> = {
  strong: "bg-green-50 text-green-700",
  moderate: "bg-amber-50 text-amber-700",
  weak: "bg-orange-50 text-orange-700",
  conflicting: "bg-red-50 text-red-700",
};

const CYCLE_LABELS: Record<string, string> = {
  expansion: "Expansion",
  peak: "Pico",
  contraction: "Contraccion",
  trough: "Valle",
};

export function MacroContext({ data }: MacroContextProps) {
  const indicators = [
    { label: "Tasa Fed", value: `${data.fed_rate.current}%`, trend: data.fed_rate.trend },
    { label: "CPI", value: `${data.cpi.current}%`, trend: data.cpi.trend },
    { label: "Treasury 10Y", value: `${data.treasury_10y.current}%`, trend: data.treasury_10y.trend },
  ];

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 animate-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-500">Contexto Macroeconomico</h3>
        <div className="flex gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700`}>
            {CYCLE_LABELS[data.cycle_phase] || data.cycle_phase}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${ALIGNMENT_COLORS[data.thesis_alignment] || "bg-zinc-50 text-zinc-700"}`}>
            Alineacion: {data.thesis_alignment}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {indicators.map((ind) => {
          const Icon = TREND_ICON[ind.trend] || Minus;
          const color = TREND_COLOR[ind.trend] || "text-zinc-500";
          return (
            <div key={ind.label} className="flex items-center justify-between bg-zinc-50 rounded-lg px-4 py-3">
              <div>
                <p className="text-xs text-zinc-400">{ind.label}</p>
                <p className="text-lg font-semibold text-zinc-900">{ind.value}</p>
              </div>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
          );
        })}
      </div>

      {data.summary && (
        <p className="text-xs text-zinc-500 leading-relaxed">{data.summary}</p>
      )}
    </div>
  );
}
