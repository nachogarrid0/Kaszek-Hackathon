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
      value: `${pnlPositive ? "+" : ""}$${total_pnl.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`,
      sub: `${pnlPositive ? "+" : ""}${total_pnl_pct}%`,
      icon: pnlPositive ? TrendingUp : TrendingDown,
      color: pnlPositive ? "text-green-600" : "text-red-600",
      bg: pnlPositive ? "bg-green-50" : "bg-red-50",
    },
    {
      label: "Retorno Diario",
      value: `${daily_return >= 0 ? "+" : ""}${daily_return}%`,
      sub: "hoy",
      icon: daily_return >= 0 ? TrendingUp : TrendingDown,
      color: daily_return >= 0 ? "text-green-600" : "text-red-600",
      bg: daily_return >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      label: "Activos",
      value: `${inProfit} ↑ / ${inLoss} ↓`,
      sub: "en ganancia / pérdida",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Capital en Riesgo",
      value: `$${capital_at_risk.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`,
      sub: "pérdidas no realizadas",
      icon: capital_at_risk > 0 ? AlertTriangle : DollarSign,
      color: capital_at_risk > 500 ? "text-amber-600" : "text-zinc-600",
      bg: capital_at_risk > 500 ? "bg-amber-50" : "bg-zinc-50",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <p className="text-xs text-zinc-500">{card.label}</p>
          <p className={`text-lg font-semibold ${card.color} mt-1`}>{card.value}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
