"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { approveStrategy } from "@/services/api";

interface ApproveButtonProps {
  strategyId: string;
}

export function ApproveButton({ strategyId }: ApproveButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "approved">("idle");

  const handleApprove = async () => {
    setStatus("loading");
    try {
      await approveStrategy(strategyId);
      setStatus("approved");
    } catch {
      setStatus("idle");
    }
  };

  if (status === "approved") {
    return (
      <div className="space-y-3 animate-in">
        <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Check className="w-5 h-5" />
          <span className="font-medium">Estrategia aprobada y guardada</span>
        </div>
        <a
          href={`/live/${strategyId}?scenario=bull`}
          className="w-full py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white font-medium hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          Abrir Live Trading
        </a>
      </div>
    );
  }

  return (
    <button
      onClick={handleApprove}
      disabled={status === "loading"}
      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold hover:from-blue-500 hover:to-violet-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 animate-in shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
    >
      {status === "loading" ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      Aprobar y guardar estrategia
    </button>
  );
}
