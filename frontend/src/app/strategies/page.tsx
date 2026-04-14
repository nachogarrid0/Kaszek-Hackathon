"use client";

import { StrategyList } from "@/components/strategies/StrategyList";

export default function StrategiesPage() {
  return (
    <div className="flex-1 bg-[var(--bg-primary)] p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-6">
          Mis Estrategias
        </h1>
        <StrategyList />
      </div>
    </div>
  );
}
