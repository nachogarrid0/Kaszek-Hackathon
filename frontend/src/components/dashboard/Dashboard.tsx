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
import { BarChart3, Sparkles } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <BarChart3 className="w-10 h-10 text-zinc-700" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center animate-glow">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
          El dashboard se construirá automáticamente mientras el agente analiza tu tesis de inversión
        </p>
        <div className="mt-4 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-pulse"
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
