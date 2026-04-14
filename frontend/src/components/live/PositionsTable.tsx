"use client";

import type { Portfolio } from "@/types/live";

interface PositionsTableProps {
  portfolio: Portfolio;
}

const STATUS_STYLES: Record<string, string> = {
  BUY:  "bg-blue-100 text-blue-700",
  HOLD: "bg-zinc-100 text-zinc-600",
  SELL: "bg-red-100 text-red-600",
};

export function PositionsTable({ portfolio }: PositionsTableProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100">
        <h3 className="text-xs font-medium text-zinc-500">Open Positions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="text-left px-4 py-2 text-xs font-medium text-zinc-400">Asset</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-zinc-400">Entry</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-zinc-400">Current</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-zinc-400">PnL $</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-zinc-400">PnL %</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-zinc-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.positions.map((pos) => (
              <tr key={pos.symbol} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-2.5 font-semibold text-zinc-900">{pos.symbol}</td>
                <td className="px-4 py-2.5 text-right text-zinc-500">${pos.entry_price.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-right text-zinc-700 font-medium">${pos.current_price.toFixed(2)}</td>
                <td className={`px-4 py-2.5 text-right font-semibold ${pos.pnl_usd >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {pos.pnl_usd >= 0 ? "+" : ""}${pos.pnl_usd.toFixed(0)}
                </td>
                <td className={`px-4 py-2.5 text-right font-semibold ${pos.pnl_pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {pos.pnl_pct >= 0 ? "+" : ""}{pos.pnl_pct.toFixed(2)}%
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[pos.status]}`}>
                    {pos.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
