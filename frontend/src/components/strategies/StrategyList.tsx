"use client";

import { useStrategies } from "@/hooks/useStrategies";
import { StrategyCard } from "./StrategyCard";
import { Inbox } from "lucide-react";

export function StrategyList() {
  const { strategies } = useStrategies();

  if (strategies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-zinc-600" />
        </div>
        <p className="text-sm text-zinc-400">
          No tenés estrategias guardadas todavía
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Creá una nueva estrategia desde el chat
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {strategies.map((s) => (
        <StrategyCard key={s.id} strategy={s} />
      ))}
    </div>
  );
}
