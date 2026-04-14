"use client";

import type { EquityCurvePoint } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from "recharts";

interface EquityCurveProps {
  data: EquityCurvePoint[];
}

export function EquityCurve({ data }: EquityCurveProps) {
  const hasBenchmark = data.some((d) => d.benchmark !== undefined);
  const tickInterval = Math.floor(data.length / 6);

  return (
    <div className="glass rounded-2xl p-6 animate-in">
      <h3 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase mb-5">
        Curva de Equity
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#52525b" }}
              interval={tickInterval}
              tickFormatter={(d: string) => d.slice(5)}
              axisLine={{ stroke: "rgba(255,255,255,0.04)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.04)" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#52525b" }}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
              axisLine={{ stroke: "rgba(255,255,255,0.04)" }}
              tickLine={{ stroke: "rgba(255,255,255,0.04)" }}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(18,18,26,0.95)",
                color: "#f4f4f5",
                backdropFilter: "blur(12px)",
              }}
              formatter={(value, name) => [
                `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                name === "portfolio" ? "Estrategia" : "S&P 500",
              ]}
            />
            <Area
              type="monotone"
              dataKey="portfolio"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#portfolioGradient)"
              dot={false}
            />
            {hasBenchmark && (
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#52525b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {hasBenchmark && (
        <div className="flex items-center gap-6 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 rounded bg-blue-500" />
            <span className="text-xs text-zinc-400">Tu Estrategia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 rounded bg-zinc-600" style={{ borderTop: "1.5px dashed #52525b" }} />
            <span className="text-xs text-zinc-400">S&P 500</span>
          </div>
        </div>
      )}
    </div>
  );
}
