"use client";

import type { BacktestPerformance, BenchmarkComparison } from "@/types";
import { TrendingUp, TrendingDown, BarChart3, Shield, Activity, Target, Percent, ArrowUpDown } from "lucide-react";

interface MetricsCardsProps {
  performance: BacktestPerformance;
  benchmark?: BenchmarkComparison;
}

export function MetricsCards({ performance, benchmark }: MetricsCardsProps) {
  const p = performance;
  const cards = [
    {
      label: "Retorno Total",
      value: `${p.total_return_pct > 0 ? "+" : ""}${p.total_return_pct}%`,
      icon: p.total_return_pct >= 0 ? TrendingUp : TrendingDown,
      color: p.total_return_pct >= 0 ? "text-green-600" : "text-red-600",
      bg: p.total_return_pct >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      label: "CAGR",
      value: `${p.cagr_pct > 0 ? "+" : ""}${p.cagr_pct}%`,
      icon: Percent,
      color: p.cagr_pct >= 0 ? "text-green-600" : "text-red-600",
      bg: p.cagr_pct >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      label: "Sharpe Ratio",
      value: p.sharpe_ratio.toFixed(2),
      icon: BarChart3,
      color: p.sharpe_ratio >= 1.0 ? "text-green-600" : "text-amber-600",
      bg: p.sharpe_ratio >= 1.0 ? "bg-green-50" : "bg-amber-50",
    },
    {
      label: "Max Drawdown",
      value: `${p.max_drawdown_pct}%`,
      icon: Shield,
      color: p.max_drawdown_pct > -20 ? "text-green-600" : "text-red-600",
      bg: p.max_drawdown_pct > -20 ? "bg-green-50" : "bg-red-50",
    },
    {
      label: "Profit Factor",
      value: p.profit_factor.toFixed(2),
      icon: Activity,
      color: p.profit_factor >= 1.3 ? "text-green-600" : "text-amber-600",
      bg: p.profit_factor >= 1.3 ? "bg-green-50" : "bg-amber-50",
    },
    {
      label: "Win Rate",
      value: `${p.win_rate_pct}%`,
      icon: Target,
      color: p.win_rate_pct >= 50 ? "text-green-600" : "text-amber-600",
      bg: p.win_rate_pct >= 50 ? "bg-green-50" : "bg-amber-50",
    },
  ];

  return (
    <div className="animate-in">
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-xs text-zinc-500">{card.label}</p>
            <p className={`text-lg font-semibold ${card.color} mt-1`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Benchmark comparison row */}
      {benchmark && (
        <div className="grid grid-cols-4 gap-3 mt-3">
          <div className="bg-white rounded-xl border border-zinc-200 p-3 text-center">
            <p className="text-xs text-zinc-400">Alpha vs SPY</p>
            <p className={`text-sm font-bold ${benchmark.alpha_pct >= 0 ? "text-green-600" : "text-red-600"}`}>
              {benchmark.alpha_pct > 0 ? "+" : ""}{benchmark.alpha_pct}%
            </p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-3 text-center">
            <p className="text-xs text-zinc-400">Beta</p>
            <p className="text-sm font-bold text-zinc-900">{benchmark.beta}</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-3 text-center">
            <p className="text-xs text-zinc-400">Mejor mes</p>
            <p className="text-sm font-bold text-green-600">+{p.best_month_pct}%</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-3 text-center">
            <p className="text-xs text-zinc-400">Peor mes</p>
            <p className="text-sm font-bold text-red-600">{p.worst_month_pct}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
