"use client";

import type { Metrics } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Shield,
  Activity,
  Target,
} from "lucide-react";

interface MetricsCardsProps {
  metrics: Metrics;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      label: "Retorno Total",
      value: `${metrics.total_return > 0 ? "+" : ""}${metrics.total_return}%`,
      icon: metrics.total_return >= 0 ? TrendingUp : TrendingDown,
      color: metrics.total_return >= 0 ? "text-green-600" : "text-red-600",
      bg: metrics.total_return >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      label: "Sharpe Ratio",
      value: metrics.sharpe_ratio.toFixed(2),
      icon: BarChart3,
      color: metrics.sharpe_ratio >= 1.0 ? "text-green-600" : "text-amber-600",
      bg: metrics.sharpe_ratio >= 1.0 ? "bg-green-50" : "bg-amber-50",
    },
    {
      label: "Max Drawdown",
      value: `${metrics.max_drawdown}%`,
      icon: Shield,
      color: metrics.max_drawdown > -20 ? "text-green-600" : "text-red-600",
      bg: metrics.max_drawdown > -20 ? "bg-green-50" : "bg-red-50",
    },
    {
      label: "Volatilidad",
      value: `${metrics.volatility}%`,
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Win Rate",
      value: `${metrics.win_rate}%`,
      icon: Target,
      color: metrics.win_rate >= 50 ? "text-green-600" : "text-amber-600",
      bg: metrics.win_rate >= 50 ? "bg-green-50" : "bg-amber-50",
    },
    {
      label: "Valor Final",
      value: `$${metrics.final_value.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-zinc-700",
      bg: "bg-zinc-50",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl border border-zinc-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <p className="text-xs text-zinc-500">{card.label}</p>
          <p className={`text-lg font-semibold ${card.color} mt-1`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
