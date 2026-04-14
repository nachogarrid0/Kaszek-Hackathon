import { create } from "zustand";
import type {
  ChatMessage,
  Asset,
  Metrics,
  EquityCurve,
  BenchmarkComparison,
  StrategyParams,
  Strategy,
} from "@/types";

interface AppState {
  // Chat
  messages: ChatMessage[];
  isStreaming: boolean;
  currentThinkingStep: string | null;

  // Dashboard
  strategyId: string | null;
  assets: Asset[];
  metrics: Metrics | null;
  equityCurve: EquityCurve | null;
  benchmarkComparison: BenchmarkComparison | null;
  strategyParams: StrategyParams | null;
  isComplete: boolean;

  // Strategies
  savedStrategies: Strategy[];

  // Actions
  addMessage: (msg: ChatMessage) => void;
  appendToLastMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  setThinkingStep: (step: string | null) => void;
  setStrategyId: (id: string) => void;
  setAssets: (assets: Asset[]) => void;
  setMetrics: (metrics: Metrics) => void;
  setEquityCurve: (curve: EquityCurve) => void;
  setBenchmarkComparison: (comparison: BenchmarkComparison) => void;
  setStrategyParams: (params: StrategyParams) => void;
  setComplete: (complete: boolean) => void;
  setSavedStrategies: (strategies: Strategy[]) => void;
  resetDashboard: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  messages: [],
  isStreaming: false,
  currentThinkingStep: null,
  strategyId: null,
  assets: [],
  metrics: null,
  equityCurve: null,
  benchmarkComparison: null,
  strategyParams: null,
  isComplete: false,
  savedStrategies: [],

  // Actions
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  appendToLastMessage: (content) =>
    set((state) => {
      const msgs = [...state.messages];
      if (msgs.length > 0 && msgs[msgs.length - 1].role === "assistant") {
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          content: msgs[msgs.length - 1].content + content,
        };
      }
      return { messages: msgs };
    }),

  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setThinkingStep: (step) => set({ currentThinkingStep: step }),
  setStrategyId: (id) => set({ strategyId: id }),
  setAssets: (assets) => set({ assets }),
  setMetrics: (metrics) => set({ metrics }),
  setEquityCurve: (curve) => set({ equityCurve: curve }),
  setBenchmarkComparison: (comparison) => set({ benchmarkComparison: comparison }),
  setStrategyParams: (params) => set({ strategyParams: params }),
  setComplete: (complete) => set({ isComplete: complete }),
  setSavedStrategies: (strategies) => set({ savedStrategies: strategies }),

  resetDashboard: () =>
    set({
      strategyId: null,
      assets: [],
      metrics: null,
      equityCurve: null,
      benchmarkComparison: null,
      strategyParams: null,
      isComplete: false,
      currentThinkingStep: null,
    }),
}));
