"use client";

import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from "lucide-react";
import type { Portfolio } from "@/types/live";

interface MetricsRowProps {
  portfolio: Portfolio;
}

export function MetricsRow({ portfolio }: MetricsRowProps) {
  const { total_pnl, total_pnl_pct, daily_return, capital_at_risk, positions } = portfolio;
  const inProfit = positions.filter((p) => p.pnl_usd >= 0).length;
  const inLoss = positions.filter((p) => p.pnl_usd < 0).length;
  const pnlPositive = total_pnl >= 0;

  const cards = [
    {
      label: "PnL Total",
      value: `${pnlPositive ? "+" : ""}$${total_pnl.toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
      sub: `${pnlPositive ? "+" : ""}${total_pnl_pct}%`,
      icon: pnlPositive ? TrendingUp : TrendingDown,
      color: pnlPositive ? "text-emerald-400" : "text-red-400",
      bg: pnlPositive ? "bg-emerald-500/10" : "bg-red-500/10",
      border: pnlPositive ? "border-emerald-500/20" : "border-red-500/20",
    },
    {
      label: "Daily Return",
      value: `${daily_return >= 0 ? "+" : ""}${daily_return}%`,
      sub: "today",
      icon: daily_return >= 0 ? TrendingUp : TrendingDown,
      color: daily_return >= 0 ? "text-emerald-400" : "text-red-400",
      bg: daily_return >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
      border: daily_return >= 0 ? "border-emerald-500/20" : "border-red-500/20",
    },
    {
      label: "Assets",
      value: `${inProfit} ↑ / ${inLoss} ↓`,
      sub: "in profit / loss",
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Capital at Risk",
      value: `$${capital_at_risk.toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
      sub: "unrealized losses",
      icon: capital_at_risk > 0 ? AlertTriangle : DollarSign,
      color: capital_at_risk > 500 ? "text-amber-400" : "text-zinc-400",
      bg: capital_at_risk > 500 ? "bg-amber-500/10" : "bg-white/[0.05]",
      border: capital_at_risk > 500 ? "border-amber-500/20" : "border-white/[0.08]",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="glass rounded-2xl p-5 hover:border-white/[0.12] transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-lg ${card.bg} border ${card.border} flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{card.label}</p>
          <p className={`text-xl font-bold ${card.color} mt-1`}>{card.value}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
