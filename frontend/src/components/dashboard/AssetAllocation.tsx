"use client";

import type { AssetSelected } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const BIAS_COLORS: Record<string, string> = {
  bullish: "bg-green-100 text-green-800",
  bearish: "bg-red-100 text-red-800",
  neutral: "bg-zinc-100 text-zinc-600",
};

interface AssetAllocationProps {
  assets: AssetSelected[];
}

export function AssetAllocation({ assets }: AssetAllocationProps) {
  const chartData = assets.map((a) => ({
    name: a.ticker,
    value: a.allocation_pct,
  }));

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 animate-in">
      <h3 className="text-sm font-medium text-zinc-500 mb-4">Asignacion de Activos</h3>

      <div className="flex items-start gap-6">
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2} dataKey="value">
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e4e4e7" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {assets.map((asset, i) => (
            <div key={asset.ticker} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-sm font-medium text-zinc-900">{asset.ticker}</span>
                <span className="text-xs text-zinc-400">{asset.name}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${BIAS_COLORS[asset.fundamental_bias] || "bg-zinc-100"}`}>
                  {asset.fundamental_bias}
                </span>
              </div>
              <span className="text-sm font-semibold text-zinc-700">{asset.allocation_pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fundamental details */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-100">
        {assets.map((a) => (
          <div key={a.ticker} className="text-xs text-zinc-500">
            <span className="font-medium text-zinc-700">{a.ticker}:</span>{" "}
            {a.pe_ratio ? `P/E ${a.pe_ratio}` : ""}{" "}
            {a.profit_margin && a.profit_margin !== "N/A" ? `| Margen ${a.profit_margin}` : ""}{" "}
            {a.analyst_consensus ? `| ${a.analyst_consensus}` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
