"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
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
      <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 animate-in fade-in duration-300">
        <Check className="w-5 h-5" />
        <span className="font-medium">Estrategia aprobada y guardada</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleApprove}
      disabled={status === "loading"}
      className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {status === "loading" ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Check className="w-4 h-4" />
      )}
      Aprobar y guardar estrategia
    </button>
  );
}
