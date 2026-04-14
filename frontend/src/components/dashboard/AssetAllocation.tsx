"use client";

import type { AssetSelected } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const BIAS_COLORS: Record<string, string> = {
  bullish: "bg-emerald-50 text-emerald-700 border-emerald-200",
  bearish: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-zinc-100 text-zinc-600 border-zinc-200",
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
    <div className="bg-white rounded-2xl p-6 animate-in border border-zinc-200 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900 tracking-wide uppercase mb-5">
        Asset Allocation
      </h3>

      <div className="flex items-start gap-6">
        <div className="w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={32} outerRadius={60} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 12,
                  border: "1px solid #e4e4e7",
                  background: "rgba(255,255,255,0.95)",
                  color: "#18181b",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {assets.map((asset, i) => (
            <div key={asset.ticker} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-sm font-semibold text-zinc-900">{asset.ticker}</span>
                <span className="text-xs text-zinc-500">{asset.name}</span>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${BIAS_COLORS[asset.fundamental_bias] || "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                  {asset.fundamental_bias}
                </span>
              </div>
              <span className="text-sm font-bold text-zinc-900">{asset.allocation_pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fundamental details */}
      <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-zinc-100">
        {assets.map((a) => (
          <div key={a.ticker} className="text-xs text-zinc-500">
            <span className="font-medium text-zinc-900">{a.ticker}:</span>{" "}
            {a.pe_ratio ? `P/E ${a.pe_ratio}` : ""}{" "}
            {a.profit_margin && a.profit_margin !== "N/A" ? `| Margin ${a.profit_margin}` : ""}{" "}
            {a.analyst_consensus ? `| ${a.analyst_consensus}` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
