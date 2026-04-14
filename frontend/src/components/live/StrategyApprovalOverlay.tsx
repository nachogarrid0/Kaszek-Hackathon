"use client";

import { AlertTriangle, Check, X } from "lucide-react";
import type { PendingStrategyChange } from "@/types/live";

interface StrategyApprovalOverlayProps {
  pending: PendingStrategyChange;
  onApprove: (approved: boolean) => void;
}

export function StrategyApprovalOverlay({ pending, onApprove }: StrategyApprovalOverlayProps) {
  return (
    <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">Trading paused</h3>
            <p className="text-xs text-zinc-500">The agent detected the current strategy is obsolete</p>
          </div>
        </div>

        <p className="text-sm text-zinc-600 mb-4 leading-relaxed">{pending.reason}</p>

        <div className="bg-zinc-50 rounded-xl p-4 mb-4 space-y-1.5">
          {pending.changes.map((change, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className={`font-mono text-xs mt-0.5 ${change.startsWith("+") ? "text-green-600" : change.startsWith("-") ? "text-red-500" : "text-zinc-400"}`}>
                {change.startsWith("+") ? "+" : change.startsWith("-") ? "−" : " "}
              </span>
              <span className="text-zinc-700">{change.replace(/^[+\-]\s*/, "")}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onApprove(false)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Reject — keep current
          </button>
          <button
            onClick={() => onApprove(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            Approve new strategy
          </button>
        </div>
      </div>
    </div>
  );
}
