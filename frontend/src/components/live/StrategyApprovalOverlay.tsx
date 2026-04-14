"use client";

import { AlertTriangle, Check, X } from "lucide-react";
import type { PendingStrategyChange } from "@/types/live";

interface StrategyApprovalOverlayProps {
  pending: PendingStrategyChange;
  onApprove: (approved: boolean) => void;
}

export function StrategyApprovalOverlay({ pending, onApprove }: StrategyApprovalOverlayProps) {
  return (
    <div className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-center z-10 rounded-2xl">
      <div className="glass rounded-3xl border border-white/[0.12] shadow-2xl shadow-black/50 p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Trading Interrumpido</h3>
            <p className="text-sm text-zinc-400">Estrategia actual requiere rotación</p>
          </div>
        </div>

        <p className="text-sm text-zinc-300 mb-6 leading-relaxed bg-white/[0.03] p-4 rounded-xl border border-white/[0.05]">{pending.reason}</p>

        <div className="bg-black/40 rounded-xl p-5 mb-8 space-y-2.5 border border-white/[0.05]">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Cambios Previstos</p>
          {pending.changes.map((change, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className={`font-mono font-bold text-sm mt-0.5 ${change.startsWith("+") ? "text-emerald-400" : change.startsWith("-") ? "text-red-400" : "text-zinc-500"}`}>
                {change.startsWith("+") ? "+" : change.startsWith("-") ? "−" : " "}
              </span>
              <span className="text-zinc-300">{change.replace(/^[+\-]\s*/, "")}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => onApprove(false)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-sm font-medium transition-all"
          >
            <X className="w-4 h-4" />
            Rechazar rotación
          </button>
          <button
            onClick={() => onApprove(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-500/50 text-white text-sm font-semibold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all"
          >
            <Check className="w-4 h-4" />
            Aprobar estrategia
          </button>
        </div>
      </div>
    </div>
  );
}
