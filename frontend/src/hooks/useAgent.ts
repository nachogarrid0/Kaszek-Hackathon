"use client";

import { useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import { runAgent } from "@/services/api";
import type { Asset, Metrics, EquityCurve, BenchmarkComparison } from "@/types";

export function useAgent() {
  const {
    isStreaming,
    addMessage,
    setStreaming,
    setThinkingStep,
    setStrategyId,
    setAssets,
    setMetrics,
    setEquityCurve,
    setBenchmarkComparison,
    setStrategyParams,
    setComplete,
    resetDashboard,
  } = useAppStore();

  const sendThesis = useCallback(
    async (thesis: string) => {
      if (isStreaming) return;

      resetDashboard();
      setStreaming(true);

      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: thesis,
        timestamp: Date.now(),
      });

      try {
        await runAgent(thesis, (event, data) => {
          switch (event) {
            case "session_start":
              setStrategyId(data.strategy_id as string);
              break;

            case "thinking":
              setThinkingStep(data.step as string);
              break;

            case "chat_message":
              addMessage({
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.content as string,
                timestamp: Date.now(),
              });
              setThinkingStep(null);
              break;

            case "dashboard_update":
              handleDashboardUpdate(data as { type: string; data: Record<string, unknown> });
              break;

            case "done":
              setComplete(true);
              setThinkingStep(null);
              break;
          }
        });
      } catch (error) {
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: Date.now(),
        });
      } finally {
        setStreaming(false);
        setThinkingStep(null);
      }
    },
    [
      isStreaming,
      addMessage,
      setStreaming,
      setThinkingStep,
      setStrategyId,
      setAssets,
      setMetrics,
      setEquityCurve,
      setBenchmarkComparison,
      setStrategyParams,
      setComplete,
      resetDashboard,
    ],
  );

  function handleDashboardUpdate(update: { type: string; data: Record<string, unknown> }) {
    switch (update.type) {
      case "assets": {
        const assets = (update.data.assets || update.data.available_assets) as Asset[];
        if (assets) setAssets(assets);
        break;
      }
      case "metrics": {
        const metrics = (update.data.metrics || update.data) as Metrics;
        if (metrics) setMetrics(metrics);
        const curve = (update.data as { equity_curve?: EquityCurve }).equity_curve;
        if (curve) setEquityCurve(curve);
        const params = (update.data as { parameters?: Record<string, unknown> }).parameters;
        if (params) setStrategyParams(params as Record<string, unknown> as import("@/types").StrategyParams);
        break;
      }
      case "equity_curve": {
        setEquityCurve(update.data as unknown as EquityCurve);
        break;
      }
      case "benchmark": {
        setBenchmarkComparison(update.data as unknown as BenchmarkComparison);
        break;
      }
      case "strategy_params": {
        setStrategyParams(update.data as unknown as import("@/types").StrategyParams);
        break;
      }
      case "strategy_complete": {
        setComplete(true);
        break;
      }
    }
  }

  return { sendThesis, isStreaming };
}
