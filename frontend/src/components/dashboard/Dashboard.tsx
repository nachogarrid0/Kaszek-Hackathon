"use client";

import { useAppStore } from "@/stores/appStore";
import { MacroContext } from "./MacroContext";
import { AssetAllocation } from "./AssetAllocation";
import { SentimentAnalysis } from "./SentimentAnalysis";
import { TechnicalSignals } from "./TechnicalSignals";
import { MetricsCards } from "./MetricsCards";
import { EquityCurve } from "./EquityCurve";
import { ApproveButton } from "./ApproveButton";
import { BarChart3 } from "lucide-react";

export function Dashboard() {
  const {
    macroContext,
    selectedAssets,
    sentimentAnalysis,
    technicalSignals,
    backtestResult,
    strategyId,
    isComplete,
  } = useAppStore();

  const hasContent =
    macroContext ||
    selectedAssets.length > 0 ||
    sentimentAnalysis ||
    technicalSignals ||
    backtestResult;

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
      {/* Phase 1: Macro context */}
      {macroContext && <MacroContext data={macroContext} />}

      {/* Phase 1: Asset allocation with fundamentals */}
      {selectedAssets.length > 0 && <AssetAllocation assets={selectedAssets} />}

      {/* Phase 1: Sentiment */}
      {sentimentAnalysis && <SentimentAnalysis data={sentimentAnalysis} />}

      {/* Phase 2: Technical signals */}
      {technicalSignals && <TechnicalSignals signals={technicalSignals} />}

      {/* Phase 3: Backtest results */}
      {backtestResult && (
        <>
          <MetricsCards
            performance={backtestResult.performance}
            benchmark={backtestResult.benchmark_comparison}
          />
          {backtestResult.equity_curve.length > 0 && (
            <EquityCurve data={backtestResult.equity_curve} />
          )}
        </>
      )}

      {/* Approve button */}
      {isComplete && strategyId && <ApproveButton strategyId={strategyId} />}
    </div>
  );
}
