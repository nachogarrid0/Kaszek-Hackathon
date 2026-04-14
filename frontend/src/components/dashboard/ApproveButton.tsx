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
      <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-in">
        <Check className="w-5 h-5" />
        <span className="font-medium">Estrategia aprobada y guardada</span>
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
