import { create } from "zustand";
import type {
  ChatMessage,
  MacroContext,
  AssetSelected,
  SentimentAnalysis,
  TechnicalSignal,
  BacktestResult,
  Strategy,
} from "@/types";

export interface ToolProgress {
  tool: string;
  status: "running" | "done" | "error";
  message: string;
  inputPreview?: string;
  resultPreview?: string;
}

interface AppState {
  // Chat
  messages: ChatMessage[];
  isStreaming: boolean;
  currentThinkingStep: string | null;
  streamingMessageId: string | null;
  toolProgress: ToolProgress | null;

  // Dashboard — progressive
  strategyId: string | null;
  macroContext: MacroContext | null;
  selectedAssets: AssetSelected[];
  sentimentAnalysis: SentimentAnalysis | null;
  technicalSignals: Record<string, TechnicalSignal> | null;
  backtestResult: BacktestResult | null;
  finalStrategy: Record<string, unknown> | null;
  isComplete: boolean;

  // Strategies
  savedStrategies: Strategy[];

  // Actions — chat
  addMessage: (msg: ChatMessage) => void;
  startStreamingMessage: () => string;
  appendToStreamingMessage: (text: string) => void;
  finishStreamingMessage: () => void;
  setStreaming: (streaming: boolean) => void;
  setThinkingStep: (step: string | null) => void;
  setToolProgress: (tp: ToolProgress | null) => void;

  // Actions — dashboard
  setStrategyId: (id: string) => void;
  setMacroContext: (ctx: MacroContext) => void;
  setSelectedAssets: (assets: AssetSelected[]) => void;
  setSentimentAnalysis: (sa: SentimentAnalysis) => void;
  setTechnicalSignals: (ts: Record<string, TechnicalSignal>) => void;
  setBacktestResult: (bt: BacktestResult) => void;
  setFinalStrategy: (fs: Record<string, unknown>) => void;
  setComplete: (complete: boolean) => void;
  resetDashboard: () => void;

  // Actions — strategies
  setSavedStrategies: (strategies: Strategy[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  messages: [],
  isStreaming: false,
  currentThinkingStep: null,
  streamingMessageId: null,
  toolProgress: null,
  strategyId: null,
  macroContext: null,
  selectedAssets: [],
  sentimentAnalysis: null,
  technicalSignals: null,
  backtestResult: null,
  finalStrategy: null,
  isComplete: false,
  savedStrategies: [],

  // Actions
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  startStreamingMessage: () => {
    const id = crypto.randomUUID();
    const msg: ChatMessage = {
      id,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, msg],
      streamingMessageId: id,
    }));
    return id;
  },

  appendToStreamingMessage: (text: string) => {
    const { streamingMessageId } = get();
    if (!streamingMessageId) return;
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === streamingMessageId
          ? { ...m, content: m.content + text }
          : m,
      ),
    }));
  },

  finishStreamingMessage: () => {
    const { streamingMessageId } = get();
    if (!streamingMessageId) return;
    // Remove empty streaming messages
    set((state) => ({
      messages: state.messages.filter(
        (m) => m.id !== streamingMessageId || m.content.trim().length > 0,
      ),
      streamingMessageId: null,
    }));
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setThinkingStep: (step) => set({ currentThinkingStep: step }),
  setToolProgress: (tp) => set({ toolProgress: tp }),
  setStrategyId: (id) => set({ strategyId: id }),
  setMacroContext: (ctx) => set({ macroContext: ctx }),
  setSelectedAssets: (assets) => set({ selectedAssets: assets }),
  setSentimentAnalysis: (sa) => set({ sentimentAnalysis: sa }),
  setTechnicalSignals: (ts) => set({ technicalSignals: ts }),
  setBacktestResult: (bt) => set({ backtestResult: bt }),
  setFinalStrategy: (fs) => set({ finalStrategy: fs }),
  setComplete: (complete) => set({ isComplete: complete }),
  setSavedStrategies: (strategies) => set({ savedStrategies: strategies }),

  resetDashboard: () =>
    set({
      strategyId: null,
      macroContext: null,
      selectedAssets: [],
      sentimentAnalysis: null,
      technicalSignals: null,
      backtestResult: null,
      finalStrategy: null,
      isComplete: false,
      currentThinkingStep: null,
      toolProgress: null,
      streamingMessageId: null,
    }),
}));
