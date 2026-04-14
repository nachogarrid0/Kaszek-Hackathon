"use client";

import { useAppStore } from "@/stores/appStore";
import { MacroContext } from "./MacroContext";
import { AssetAllocation } from "./AssetAllocation";
import { SentimentAnalysis } from "./SentimentAnalysis";
import { TechnicalSignals } from "./TechnicalSignals";
import { MetricsCards } from "./MetricsCards";
import { EquityCurve } from "./EquityCurve";
import { ApproveButton } from "./ApproveButton";
import { StrategySummary } from "./StrategySummary";
import { Activity, Sparkles } from "lucide-react";

export function Dashboard() {
  const {
    macroContext,
    selectedAssets,
    sentimentAnalysis,
    technicalSignals,
    backtestResult,
    finalStrategy,
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
      <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px]">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
            <Activity className="w-8 h-8 text-zinc-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
          The dashboard will build automatically as the agent analyzes your investment thesis
        </p>
        <div className="mt-4 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
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

      {/* Phase 3: Strategy summary (entry/exit rules) */}
      {finalStrategy && <StrategySummary data={finalStrategy} />}

      {/* Phase 3: Backtest results */}
      {backtestResult && (
        <>
          {backtestResult.performance && (
            <MetricsCards
              performance={backtestResult.performance}
              benchmark={backtestResult.benchmark_comparison}
            />
          )}
          {backtestResult.equity_curve && backtestResult.equity_curve.length > 0 && (
            <EquityCurve data={backtestResult.equity_curve} />
          )}
        </>
      )}

      {/* Approve button */}
      {isComplete && strategyId && <ApproveButton strategyId={strategyId} />}
    </div>
  );
}
