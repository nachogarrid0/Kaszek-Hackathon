"use client";

import { useStrategies } from "@/hooks/useStrategies";
import { StrategyCard } from "./StrategyCard";
import { Inbox } from "lucide-react";

export function StrategyList() {
  const { strategies } = useStrategies();

  if (strategies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-sm text-zinc-500">
          No tenes estrategias guardadas todavia
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Crea una nueva estrategia desde el chat
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {strategies.map((s) => (
        <StrategyCard key={s.id} strategy={s} />
      ))}
    </div>
  );
}
