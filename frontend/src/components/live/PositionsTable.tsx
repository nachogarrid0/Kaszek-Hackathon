"use client";

import type { Portfolio } from "@/types/live";

interface PositionsTableProps {
  portfolio: Portfolio;
}

const STATUS_STYLES: Record<string, string> = {
  BUY: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  HOLD: "bg-white/[0.05] text-zinc-400 border border-white/[0.08]",
  SELL: "bg-red-500/10 text-red-400 border border-red-500/20",
};

export function PositionsTable({ portfolio }: PositionsTableProps) {
  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/[0.08]">
      <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
        <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Posiciones Abiertas</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.01]">
              <th className="text-left px-5 py-3 text-[10px] uppercase font-semibold text-zinc-500">Activo</th>
              <th className="text-right px-5 py-3 text-[10px] uppercase font-semibold text-zinc-500">Entrada</th>
              <th className="text-right px-5 py-3 text-[10px] uppercase font-semibold text-zinc-500">Actual</th>
              <th className="text-right px-5 py-3 text-[10px] uppercase font-semibold text-zinc-500">PnL $</th>
              <th className="text-right px-5 py-3 text-[10px] uppercase font-semibold text-zinc-500">PnL %</th>
              <th className="text-center px-5 py-3 text-[10px] uppercase font-semibold text-zinc-500">Estado</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.positions.map((pos) => (
              <tr key={pos.symbol} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3.5 font-bold text-white">{pos.symbol}</td>
                <td className="px-5 py-3.5 text-right text-zinc-500">${pos.entry_price.toFixed(2)}</td>
                <td className="px-5 py-3.5 text-right text-zinc-300 font-medium">${pos.current_price.toFixed(2)}</td>
                <td className={`px-5 py-3.5 text-right font-bold ${pos.pnl_usd >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {pos.pnl_usd >= 0 ? "+" : ""}${pos.pnl_usd.toFixed(0)}
                </td>
                <td className={`px-5 py-3.5 text-right font-bold ${pos.pnl_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {pos.pnl_pct >= 0 ? "+" : ""}{pos.pnl_pct.toFixed(2)}%
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${STATUS_STYLES[pos.status]}`}>
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
