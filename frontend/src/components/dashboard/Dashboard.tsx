"use client";

import { useAppStore } from "@/stores/appStore";
import { AssetAllocation } from "./AssetAllocation";
import { MetricsCards } from "./MetricsCards";
import { EquityCurve } from "./EquityCurve";
import { BenchmarkComparison } from "./BenchmarkComparison";
import { StrategyDetails } from "./StrategyDetails";
import { ApproveButton } from "./ApproveButton";
import { BarChart3 } from "lucide-react";

export function Dashboard() {
  const {
    assets,
    metrics,
    equityCurve,
    benchmarkComparison,
    strategyParams,
    strategyId,
    isComplete,
  } = useAppStore();

  const hasContent = assets.length > 0 || metrics || equityCurve;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-sm text-zinc-400">
          El dashboard se va a construir automaticamente mientras el agente trabaja
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Asset allocation */}
      {assets.length > 0 && <AssetAllocation assets={assets} />}

      {/* Metrics */}
      {metrics && <MetricsCards metrics={metrics} />}

      {/* Equity curve */}
      {equityCurve && (
        <EquityCurve
          equityCurve={equityCurve}
          benchmarkCurve={benchmarkComparison?.benchmark.equity_curve}
        />
      )}

      {/* Benchmark comparison */}
      {benchmarkComparison && (
        <BenchmarkComparison comparison={benchmarkComparison} />
      )}

      {/* Strategy details */}
      {strategyParams && <StrategyDetails params={strategyParams} />}

      {/* Approve button */}
      {isComplete && strategyId && <ApproveButton strategyId={strategyId} />}
    </div>
  );
}
