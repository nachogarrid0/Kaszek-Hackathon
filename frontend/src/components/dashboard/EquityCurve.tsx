"use client";

import type { EquityCurve as EquityCurveType } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EquityCurveProps {
  equityCurve: EquityCurveType;
  benchmarkCurve?: EquityCurveType;
}

export function EquityCurve({ equityCurve, benchmarkCurve }: EquityCurveProps) {
  const data = equityCurve.dates.map((date, i) => ({
    date,
    strategy: equityCurve.values[i],
    benchmark: benchmarkCurve?.values[i],
  }));

  // Show fewer tick labels
  const tickInterval = Math.floor(data.length / 6);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-sm font-medium text-zinc-500 mb-4">
        Curva de Equity
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#a1a1aa" }}
              interval={tickInterval}
              tickFormatter={(d: string) => d.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#a1a1aa" }}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e4e4e7",
              }}
              formatter={(value, name) => [
                `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                name === "strategy" ? "Estrategia" : "S&P 500",
              ]}
            />
            <Line
              type="monotone"
              dataKey="strategy"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            {benchmarkCurve && (
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#a1a1aa"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {benchmarkCurve && (
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-blue-500 rounded" />
            <span className="text-xs text-zinc-500">Tu Estrategia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-zinc-400 rounded border-dashed" />
            <span className="text-xs text-zinc-500">S&P 500</span>
          </div>
        </div>
      )}
    </div>
  );
}
