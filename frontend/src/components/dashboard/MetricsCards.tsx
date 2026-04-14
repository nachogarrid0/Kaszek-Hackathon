"use client";

import type { BacktestPerformance, BenchmarkComparison } from "@/types";
import { TrendingUp, TrendingDown, BarChart3, Shield, Activity, Target, Percent } from "lucide-react";

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
      color: p.total_return_pct >= 0 ? "text-emerald-400" : "text-red-400",
      glow: p.total_return_pct >= 0 ? "shadow-emerald-500/10" : "shadow-red-500/10",
    },
    {
      label: "CAGR",
      value: `${p.cagr_pct > 0 ? "+" : ""}${p.cagr_pct}%`,
      icon: Percent,
      color: p.cagr_pct >= 0 ? "text-emerald-400" : "text-red-400",
      glow: p.cagr_pct >= 0 ? "shadow-emerald-500/10" : "shadow-red-500/10",
    },
    {
      label: "Sharpe Ratio",
      value: p.sharpe_ratio.toFixed(2),
      icon: BarChart3,
      color: p.sharpe_ratio >= 1.0 ? "text-emerald-400" : "text-amber-400",
      glow: p.sharpe_ratio >= 1.0 ? "shadow-emerald-500/10" : "shadow-amber-500/10",
    },
    {
      label: "Max Drawdown",
      value: `${p.max_drawdown_pct}%`,
      icon: Shield,
      color: p.max_drawdown_pct > -20 ? "text-emerald-400" : "text-red-400",
      glow: p.max_drawdown_pct > -20 ? "shadow-emerald-500/10" : "shadow-red-500/10",
    },
    {
      label: "Profit Factor",
      value: p.profit_factor.toFixed(2),
      icon: Activity,
      color: p.profit_factor >= 1.3 ? "text-emerald-400" : "text-amber-400",
      glow: p.profit_factor >= 1.3 ? "shadow-emerald-500/10" : "shadow-amber-500/10",
    },
    {
      label: "Win Rate",
      value: `${p.win_rate_pct}%`,
      icon: Target,
      color: p.win_rate_pct >= 50 ? "text-emerald-400" : "text-amber-400",
      glow: p.win_rate_pct >= 50 ? "shadow-emerald-500/10" : "shadow-amber-500/10",
    },
  ];

  return (
    <div className="animate-in">
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <div key={card.label} className={`glass rounded-2xl p-4 shadow-lg ${card.glow}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{card.label}</p>
            <p className={`text-xl font-bold ${card.color} mt-1`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Benchmark comparison row */}
      {benchmark && (
        <div className="grid grid-cols-4 gap-3 mt-3">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-[10px] text-zinc-500">Alpha vs SPY</p>
            <p className={`text-sm font-bold mt-1 ${benchmark.alpha_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {benchmark.alpha_pct > 0 ? "+" : ""}{benchmark.alpha_pct}%
            </p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-[10px] text-zinc-500">Beta</p>
            <p className="text-sm font-bold text-white mt-1">{benchmark.beta}</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-[10px] text-zinc-500">Mejor mes</p>
            <p className="text-sm font-bold text-emerald-400 mt-1">+{p.best_month_pct}%</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-[10px] text-zinc-500">Peor mes</p>
            <p className="text-sm font-bold text-red-400 mt-1">{p.worst_month_pct}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
