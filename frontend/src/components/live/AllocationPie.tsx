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
    <div className="bg-white rounded-xl border border-zinc-200 p-4 flex-1">
      <h3 className="text-xs font-medium text-zinc-500 mb-3">Allocación del Portfolio</h3>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={52} paddingAngle={2} dataKey="value">
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs font-medium text-zinc-800">{d.name}</span>
              </div>
              <span className="text-xs text-zinc-500">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
