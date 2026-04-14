"use client";

import { MetricsRow } from "./MetricsRow";
import { AllocationPie } from "./AllocationPie";
import { GainsPie } from "./GainsPie";
import { PositionsTable } from "./PositionsTable";
import type { Portfolio } from "@/types/live";

interface PortfolioDashboardProps {
  portfolio: Portfolio;
}

export function PortfolioDashboard({ portfolio }: PortfolioDashboardProps) {
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      <MetricsRow portfolio={portfolio} />
      <div className="flex gap-4">
        <AllocationPie portfolio={portfolio} />
        <GainsPie portfolio={portfolio} />
      </div>
      <PositionsTable portfolio={portfolio} />
    </div>
  );
}
