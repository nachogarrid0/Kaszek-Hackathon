"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Portfolio } from "@/types/live";

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ef4444", "#ec4899"];

interface GainsPieProps {
  portfolio: Portfolio;
}

export function GainsPie({ portfolio }: GainsPieProps) {
  const raw = portfolio.gains_pie;

  // Stable color per symbol so pie slices and legend always match
  const colorMap = Object.fromEntries(
    raw.map((d, i) => [d.symbol, COLORS[i % COLORS.length]])
  );

  const positiveData = raw.filter((d) => d.gain > 0).map((d) => ({ name: d.symbol, value: d.gain }));
  const displayData = positiveData.length > 0 ? positiveData : [{ name: "–", value: 1 }];

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 flex-1">
      <h3 className="text-xs font-medium text-zinc-500 mb-3">Gain per Asset</h3>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={displayData} cx="50%" cy="50%" innerRadius={28} outerRadius={52} paddingAngle={2} dataKey="value">
                {displayData.map((d) => (
                  <Cell key={d.name} fill={colorMap[d.name] ?? COLORS[0]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => (typeof v === "number" ? `$${v.toFixed(0)}` : "–")} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e4e4e7" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5">
          {raw.map((d) => (
            <div key={d.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorMap[d.symbol] }} />
                <span className="text-xs font-medium text-zinc-800">{d.symbol}</span>
              </div>
              <span className={`text-xs font-semibold ${d.gain >= 0 ? "text-green-600" : "text-red-500"}`}>
                {d.gain >= 0 ? "+" : ""}${d.gain.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
