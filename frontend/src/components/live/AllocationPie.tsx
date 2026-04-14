"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Portfolio } from "@/types/live";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

interface AllocationPieProps {
  portfolio: Portfolio;
}

export function AllocationPie({ portfolio }: AllocationPieProps) {
  const data = portfolio.allocation_pie.map((d) => ({ name: d.symbol, value: d.pct }));

  return (
    <div className="glass rounded-2xl p-5 flex-1 hover:border-white/[0.12] transition-colors">
      <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-4">Portfolio Allocation</h3>
      <div className="flex items-center gap-5">
        <div className="w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value" stroke="rgba(255,255,255,0.05)">
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => `${v}%`}
                contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(18,18,26,0.9)", color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2h-2 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs font-semibold text-zinc-300">{d.name}</span>
              </div>
              <span className="text-xs text-zinc-500">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
