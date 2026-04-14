"use client";

import { useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import { clarifyThesis, submitClarificationAnswers, runAgentWithContext, runAgent } from "@/services/api";
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
      store.clearClarification();
      store.setStreaming(true);
      store.setPhase("clarifying");

      // Add user message to chat
      store.addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: thesis,
        timestamp: Date.now(),
      });

      try {
        // Phase 0: Get clarification questions from Claude
        const clarification = await clarifyThesis(thesis);

        store.setClarificationSession(
          clarification.session_id,
          clarification.intro_message,
          clarification.questions,
        );

        // Add the intro message as assistant message
        store.addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: clarification.intro_message,
          timestamp: Date.now(),
        });

        store.setStreaming(false);
      } catch (error) {
        console.warn("Clarification failed, falling back to direct run:", error);
        // If clarification fails, fall back to direct agent run
        store.setPhase("analyzing");
        await _runAgent(thesis);
      }
    },
    [store],
  );

  const submitAnswersAndRun = useCallback(
    async (answers: Record<string, string>) => {
      const sessionId = store.clarificationSessionId;
      if (!sessionId || store.isStreaming) return;

      store.setStreaming(true);
      store.setPhase("analyzing");

      // Add a summary of the answers as a user message
      const questionMap: Record<string, string> = {};
      for (const q of store.clarificationQuestions) {
        questionMap[q.id] = q.question;
      }
      const answerLines = Object.entries(answers)
        .map(([key, value]) => `• ${questionMap[key] || key}: ${value}`)
        .join("\n");

      store.addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: answerLines,
        timestamp: Date.now(),
      });

      try {
        await submitClarificationAnswers(sessionId, answers);
        await runAgentWithContext(sessionId, (event, data) => {
          _handleAgentEvent(event, data);
        });
      } catch (error) {
        store.addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: Date.now(),
        });
      } finally {
        store.setStreaming(false);
        store.clearProgress();
      }
    },
    [store],
  );

  async function _runAgent(thesis: string) {
    try {
      await runAgent(thesis, (event, data) => {
        _handleAgentEvent(event, data);
      });
    } catch (error) {
      store.addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now(),
      });
    } finally {
      store.setStreaming(false);
      store.clearProgress();
    }
  }

  function _handleAgentEvent(event: string, data: Record<string, unknown>) {
    console.log(`[useAgent] SSE Event: ${event}`, data);

    switch (event) {
      case "session_start":
        store.setStrategyId(data.strategy_id as string);
        break;

      case "status":
        store.setCurrentStatusText(data.message as string);
        break;

      // Text deltas — ignore for chat (prevents fragmentation)
      case "text_delta":
        break;

      // Complete text block — accumulate silently (no chat bubble during analysis)
      // All text blocks get concatenated and flushed as ONE message on "done"
      case "chat_message":
        store.appendAgentText(data.content as string + "\n\n");
        store.setCurrentStatusText(null);
        break;

      // Tool lifecycle — show as animated progress
      case "tool_start":
        store.setToolProgress({
          tool: data.tool as string,
          status: "running",
          message: data.message as string,
        });
        store.setCurrentStatusText(data.message as string);
        break;

      case "tool_executing":
        store.setToolProgress({
          tool: data.tool as string,
          status: "running",
          message: store.currentStatusText || "Ejecutando...",
          inputPreview: data.input_preview as string,
        });
        break;

      case "tool_result":
        store.addCompletedStep({
          id: crypto.randomUUID(),
          tool: data.tool as string,
          message: store.currentStatusText || "Completado",
          resultPreview: data.preview as string,
          ok: data.ok as boolean,
        });
        store.setToolProgress(null);
        store.setCurrentStatusText(null);
        break;

      case "dashboard_update":
        handleDashboardUpdate(data as { type: string; data: Record<string, unknown> });
        break;

      case "usage":
        console.log(`[useAgent] Usage updated:`, data);
        break;

      case "error":
        console.error(`[useAgent] Agent Error:`, data.message);
        store.addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${data.message as string}`,
          timestamp: Date.now(),
        });
        break;

      case "done":
        console.log(`[useAgent] Done event received, finalizing chat...`);
        // Add the final accumulated text as ONE clean chat message
        const finalText = store.agentAccumulatedText.trim();
        if (finalText) {
          store.addMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content: finalText,
            timestamp: Date.now(),
          });
        }
        store.setComplete(true);
        store.clearProgress();
        break;
    }
  }

  function handleDashboardUpdate(update: { type: string; data: Record<string, unknown> }) {
    console.log(`[useAgent] Dashboard Update: ${update.type}`, update.data);

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
      default:
        console.warn(`[useAgent] Unrecognized dashboard update type: ${update.type}`);
    }
  }

  return {
    sendThesis,
    submitAnswersAndRun,
    isStreaming: store.isStreaming,
    phase: store.phase,
  };
}
