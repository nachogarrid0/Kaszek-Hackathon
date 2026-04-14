"use client";

import { useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import { runAgent } from "@/services/api";
import type {
  MacroContext,
  AssetSelected,
  SentimentAnalysis,
  TechnicalSignal,
  BacktestResult,
} from "@/types";

export function useAgent() {
  const store = useAppStore();

  const sendThesis = useCallback(
    async (thesis: string) => {
      if (store.isStreaming) return;

      store.resetDashboard();
      store.setStreaming(true);

      store.addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: thesis,
        timestamp: Date.now(),
      });

      try {
        await runAgent(thesis, (event, data) => {
          switch (event) {
            // ── Session lifecycle ──
            case "session_start":
              store.setStrategyId(data.strategy_id as string);
              break;

            case "status":
              store.setThinkingStep(data.message as string);
              break;

            // ── Streaming text (token by token) ──
            case "text_delta": {
              if (!store.streamingMessageId) {
                store.startStreamingMessage();
              }
              store.setThinkingStep(null);
              store.setToolProgress(null);
              store.appendToStreamingMessage(data.content as string);
              break;
            }

            // ── Complete chat message (fallback for non-streamed) ──
            case "chat_message": {
              store.finishStreamingMessage();
              store.addMessage({
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.content as string,
                timestamp: Date.now(),
              });
              store.setThinkingStep(null);
              store.setToolProgress(null);
              break;
            }

            // ── Tool lifecycle: start → executing → result ──
            case "tool_start":
              store.finishStreamingMessage();
              store.setToolProgress({
                tool: data.tool as string,
                status: "running",
                message: data.message as string,
              });
              store.setThinkingStep(data.message as string);
              break;

            case "tool_executing":
              store.setToolProgress({
                tool: data.tool as string,
                status: "running",
                message: store.currentThinkingStep || "Ejecutando...",
                inputPreview: data.input_preview as string,
              });
              break;

            case "tool_result":
              store.setToolProgress({
                tool: data.tool as string,
                status: data.ok ? "done" : "error",
                message: data.ok ? "Completado" : "Error",
                resultPreview: data.preview as string,
              });
              // Clear after a short visual delay
              setTimeout(() => {
                store.setToolProgress(null);
                store.setThinkingStep(null);
              }, 800);
              break;

            // ── Dashboard updates ──
            case "dashboard_update":
              handleDashboardUpdate(data as { type: string; data: Record<string, unknown> });
              break;

            // ── Usage stats ──
            case "usage":
              // Could display token usage if desired
              break;

            // ── Error ──
            case "error":
              store.finishStreamingMessage();
              store.addMessage({
                id: crypto.randomUUID(),
                role: "assistant",
                content: `Error: ${data.message as string}`,
                timestamp: Date.now(),
              });
              break;

            // ── Done ──
            case "done":
              store.finishStreamingMessage();
              store.setComplete(true);
              store.setThinkingStep(null);
              store.setToolProgress(null);
              break;
          }
        });
      } catch (error) {
        store.finishStreamingMessage();
        store.addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: Date.now(),
        });
      } finally {
        store.setStreaming(false);
        store.setThinkingStep(null);
        store.setToolProgress(null);
      }
    },
    [store],
  );

  function handleDashboardUpdate(update: { type: string; data: Record<string, unknown> }) {
    switch (update.type) {
      case "macro_context":
        store.setMacroContext(update.data as unknown as MacroContext);
        break;
      case "assets_selected": {
        const assets = (update.data as { assets?: AssetSelected[] }).assets;
        if (assets) store.setSelectedAssets(assets);
        break;
      }
      case "sentiment_analysis":
        store.setSentimentAnalysis(update.data as unknown as SentimentAnalysis);
        break;
      case "technical_signals": {
        const signals = (update.data as { signals?: Record<string, TechnicalSignal> }).signals;
        if (signals) store.setTechnicalSignals(signals);
        break;
      }
      case "backtest_result":
        store.setBacktestResult(update.data as unknown as BacktestResult);
        break;
      case "final_strategy":
        store.setFinalStrategy(update.data);
        store.setComplete(true);
        break;
    }
  }

  return { sendThesis, isStreaming: store.isStreaming };
}
