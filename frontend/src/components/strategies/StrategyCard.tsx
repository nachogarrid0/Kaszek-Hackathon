"use client";

import type { Strategy } from "@/types";
import { TrendingUp, TrendingDown, CheckCircle } from "lucide-react";

interface StrategyCardProps {
  strategy: Strategy;
}

export function StrategyCard({ strategy }: StrategyCardProps) {
  const isPositive = (strategy.metrics?.total_return ?? 0) >= 0;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 hover:border-zinc-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm text-zinc-900 font-medium line-clamp-2">
            &ldquo;{strategy.thesis}&rdquo;
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {strategy.created_at ? new Date(strategy.created_at).toLocaleDateString("es") : ""}
          </p>
        </div>
        {strategy.approved && (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />
        )}
      </div>

      {strategy.metrics && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <p className="text-xs text-zinc-400">Return</p>
            <p className={`text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? "+" : ""}{strategy.metrics.total_return}%
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Sharpe</p>
            <p className="text-sm font-semibold text-zinc-900">
              {strategy.metrics.sharpe_ratio}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Drawdown</p>
            <p className="text-sm font-semibold text-zinc-900">
              {strategy.metrics.max_drawdown}%
            </p>
          </div>
        </div>
      )}

      {strategy.assets && strategy.assets.length > 0 && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {strategy.assets.map((a) => (
            <span
              key={a.symbol}
              className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full"
            >
              {a.symbol}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
