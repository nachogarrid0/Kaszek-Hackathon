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
    <div className="glass rounded-2xl p-5 flex-1 hover:border-white/[0.12] transition-colors">
      <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-4">Ganancia por Activo</h3>
      <div className="flex items-center gap-5">
        <div className="w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={displayData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value" stroke="rgba(255,255,255,0.05)">
                {displayData.map((d) => (
                  <Cell key={d.name} fill={colorMap[d.name] ?? COLORS[0]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => (typeof v === "number" ? `$${v.toFixed(0)}` : "–")}
                contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(18,18,26,0.9)", color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {raw.map((d) => (
            <div key={d.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorMap[d.symbol] }} />
                <span className="text-xs font-semibold text-zinc-300">{d.symbol}</span>
              </div>
              <span className={`text-xs font-bold ${d.gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {d.gain >= 0 ? "+" : ""}${d.gain.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
