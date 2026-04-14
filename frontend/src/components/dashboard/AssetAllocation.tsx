"use client";

import type { Asset } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

interface AssetAllocationProps {
  assets: Asset[];
}

export function AssetAllocation({ assets }: AssetAllocationProps) {
  const chartData = assets.map((a) => ({
    name: a.symbol,
    value: a.allocation,
  }));

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-sm font-medium text-zinc-500 mb-4">
        Asset Allocation
      </h3>
      <div className="flex items-center gap-6">
        <div className="w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e4e4e7",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {assets.map((asset, i) => (
            <div key={asset.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-sm font-medium text-zinc-900">
                  {asset.symbol}
                </span>
                {asset.name && (
                  <span className="text-xs text-zinc-400">{asset.name}</span>
                )}
              </div>
              <span className="text-sm font-semibold text-zinc-700">
                {asset.allocation}%
              </span>
            </div>
          ))}
        </div>
      </div>
      {assets[0]?.reason && (
        <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
          {assets[0].reason}
        </p>
      )}
    </div>
  );
}
