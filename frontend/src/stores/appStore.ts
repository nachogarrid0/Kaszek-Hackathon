import { create } from "zustand";
import type {
  ChatMessage,
  MacroContext,
  AssetSelected,
  SentimentAnalysis,
  TechnicalSignal,
  BacktestResult,
  Strategy,
  ClarificationQuestion,
  AppPhase,
} from "@/types";

export interface ToolProgress {
  tool: string;
  status: "running" | "done" | "error";
  message: string;
  inputPreview?: string;
  resultPreview?: string;
}

export interface CompletedStep {
  id: string;
  tool: string;
  message: string;
  resultPreview?: string;
  ok: boolean;
}

interface AppState {
  // Phase
  phase: AppPhase;

  // Clarification
  clarificationSessionId: string | null;
  clarificationIntro: string | null;
  clarificationQuestions: ClarificationQuestion[];
  clarificationAnswers: Record<string, string>;

  // Chat (only user messages + final agent response)
  messages: ChatMessage[];
  isStreaming: boolean;

  // Agent progress (separate from chat — shown as animated status)
  currentStatusText: string | null;
  toolProgress: ToolProgress | null;
  completedSteps: CompletedStep[];
  agentAccumulatedText: string;

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

  // Actions — phase
  setPhase: (phase: AppPhase) => void;

  // Actions — clarification
  setClarificationSession: (sessionId: string, intro: string, questions: ClarificationQuestion[]) => void;
  setClarificationAnswer: (questionId: string, answer: string) => void;
  clearClarification: () => void;

  // Actions — chat
  addMessage: (msg: ChatMessage) => void;
  setStreaming: (streaming: boolean) => void;

  // Actions — agent progress
  setCurrentStatusText: (text: string | null) => void;
  setToolProgress: (tp: ToolProgress | null) => void;
  addCompletedStep: (step: CompletedStep) => void;
  appendAgentText: (text: string) => void;
  clearAgentText: () => void;
  clearProgress: () => void;

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

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  phase: "idle",
  clarificationSessionId: null,
  clarificationIntro: null,
  clarificationQuestions: [],
  clarificationAnswers: {},
  messages: [],
  isStreaming: false,
  currentStatusText: null,
  toolProgress: null,
  completedSteps: [],
  agentAccumulatedText: "",
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
  setPhase: (phase) => set({ phase }),

  setClarificationSession: (sessionId, intro, questions) =>
    set({
      clarificationSessionId: sessionId,
      clarificationIntro: intro,
      clarificationQuestions: questions,
      clarificationAnswers: {},
      phase: "answering",
    }),

  setClarificationAnswer: (questionId, answer) =>
    set((state) => ({
      clarificationAnswers: { ...state.clarificationAnswers, [questionId]: answer },
    })),

  clearClarification: () =>
    set({
      clarificationSessionId: null,
      clarificationIntro: null,
      clarificationQuestions: [],
      clarificationAnswers: {},
    }),

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  setCurrentStatusText: (text) => set({ currentStatusText: text }),
  setToolProgress: (tp) => set({ toolProgress: tp }),
  addCompletedStep: (step) =>
    set((state) => ({ completedSteps: [...state.completedSteps, step] })),
  appendAgentText: (text) =>
    set((state) => ({ agentAccumulatedText: state.agentAccumulatedText + text })),
  clearAgentText: () => set({ agentAccumulatedText: "" }),
  clearProgress: () =>
    set({
      currentStatusText: null,
      toolProgress: null,
      completedSteps: [],
      agentAccumulatedText: "",
    }),

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
      currentStatusText: null,
      toolProgress: null,
      completedSteps: [],
      agentAccumulatedText: "",
    }),
}));
