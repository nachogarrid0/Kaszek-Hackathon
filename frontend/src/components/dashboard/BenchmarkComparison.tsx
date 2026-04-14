"use client";

import type { BenchmarkComparison as BenchmarkComparisonType } from "@/types";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface BenchmarkComparisonProps {
  comparison: BenchmarkComparisonType;
}

export function BenchmarkComparison({ comparison }: BenchmarkComparisonProps) {
  const { strategy, benchmark, comparison: comp } = comparison;

  const rows = [
    {
      label: "Retorno Total",
      strategy: `${strategy.total_return}%`,
      benchmark: `${benchmark.metrics.total_return}%`,
      diff: comp.excess_return,
    },
    {
      label: "Sharpe Ratio",
      strategy: strategy.sharpe_ratio.toFixed(2),
      benchmark: benchmark.metrics.sharpe_ratio.toFixed(2),
      diff: comp.sharpe_diff,
    },
    {
      label: "Max Drawdown",
      strategy: `${strategy.max_drawdown}%`,
      benchmark: `${benchmark.metrics.max_drawdown}%`,
      diff: strategy.max_drawdown - benchmark.metrics.max_drawdown,
    },
    {
      label: "Volatilidad",
      strategy: `${strategy.volatility}%`,
      benchmark: `${benchmark.metrics.volatility}%`,
      diff: strategy.volatility - benchmark.metrics.volatility,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-500">
          vs {benchmark.symbol}
        </h3>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            comp.beats_benchmark
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {comp.beats_benchmark ? "Supera al benchmark" : "Por debajo del benchmark"}
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 w-28">{row.label}</span>
            <span className="text-sm font-medium text-zinc-900 w-20 text-right">
              {row.strategy}
            </span>
            <span className="text-sm text-zinc-400 w-20 text-right">
              {row.benchmark}
            </span>
            <div className="flex items-center gap-1 w-20 justify-end">
              {row.diff > 0 ? (
                <ArrowUp className="w-3 h-3 text-green-600" />
              ) : row.diff < 0 ? (
                <ArrowDown className="w-3 h-3 text-red-600" />
              ) : (
                <Minus className="w-3 h-3 text-zinc-400" />
              )}
              <span
                className={`text-xs font-medium ${
                  row.diff > 0
                    ? "text-green-600"
                    : row.diff < 0
                    ? "text-red-600"
                    : "text-zinc-400"
                }`}
              >
                {row.diff > 0 ? "+" : ""}
                {row.diff.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
