"use client";

import type { StrategyParams } from "@/types";

interface StrategyDetailsProps {
  params: StrategyParams;
}

export function StrategyDetails({ params }: StrategyDetailsProps) {
  const details = [
    { label: "Stop-Loss", value: params.stop_loss ? `${params.stop_loss}%` : "Sin stop-loss" },
    { label: "Take-Profit", value: params.take_profit ? `${params.take_profit}%` : "Sin take-profit" },
    { label: "Rebalanceo", value: _formatFrequency(params.rebalance_frequency) },
  ];

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-sm font-medium text-zinc-500 mb-4">
        Parametros de la Estrategia
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {details.map((d) => (
          <div key={d.label}>
            <p className="text-xs text-zinc-400">{d.label}</p>
            <p className="text-sm font-semibold text-zinc-900 mt-1">{d.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function _formatFrequency(freq?: string): string {
  const map: Record<string, string> = {
    monthly: "Mensual",
    quarterly: "Trimestral",
    yearly: "Anual",
    none: "Sin rebalanceo",
  };
  return freq ? map[freq] || freq : "N/A";
}
