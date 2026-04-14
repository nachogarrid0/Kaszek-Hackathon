"use client";

import type { AssetSelected } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const BIAS_COLORS: Record<string, string> = {
  bullish: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  bearish: "bg-red-500/10 text-red-400 border-red-500/20",
  neutral: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
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
    <div className="glass rounded-2xl p-6 animate-in">
      <h3 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase mb-5">
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
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(18,18,26,0.95)",
                  color: "#f4f4f5",
                  backdropFilter: "blur(12px)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {assets.map((asset, i) => (
            <div key={asset.ticker} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: COLORS[i % COLORS.length], boxShadow: `0 0 8px ${COLORS[i % COLORS.length]}40` }} />
                <span className="text-sm font-semibold text-white">{asset.ticker}</span>
                <span className="text-xs text-zinc-500">{asset.name}</span>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${BIAS_COLORS[asset.fundamental_bias] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
                  {asset.fundamental_bias}
                </span>
              </div>
              <span className="text-sm font-bold text-white">{asset.allocation_pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fundamental details */}
      <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-white/[0.06]">
        {assets.map((a) => (
          <div key={a.ticker} className="text-xs text-zinc-500">
            <span className="font-medium text-zinc-300">{a.ticker}:</span>{" "}
            {a.pe_ratio ? `P/E ${a.pe_ratio}` : ""}{" "}
            {a.profit_margin && a.profit_margin !== "N/A" ? `| Margin ${a.profit_margin}` : ""}{" "}
            {a.analyst_consensus ? `| ${a.analyst_consensus}` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
