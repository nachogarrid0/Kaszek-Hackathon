"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/appStore";
import { useAgent } from "@/hooks/useAgent";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { AgentProgress } from "./AgentProgress";
import { ClarificationForm } from "./ClarificationForm";
import { TrendingUp, Sparkles } from "lucide-react";

export function ChatContainer() {
  const {
    messages,
    isStreaming,
    phase,
    clarificationQuestions,
  } = useAppStore();
  const { sendThesis, submitAnswersAndRun } = useAgent();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase, isStreaming]);

  const isEmpty = messages.length === 0;
  const showClarificationForm =
    phase === "answering" && clarificationQuestions.length > 0;
  const showInput = phase === "idle" || phase === "analyzing";

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        {isEmpty ? (
          <EmptyState onSelect={sendThesis} disabled={isStreaming} />
        ) : (
          <div className="space-y-4">
            {/* Chat messages — only user + final agent responses */}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Clarification form — interactive questions from Claude */}
            {showClarificationForm && (
              <ClarificationForm
                onSubmit={submitAnswersAndRun}
                disabled={isStreaming}
              />
            )}

            {/* Agent progress — animated status (separate from chat) */}
            <AgentProgress />

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input — hide during clarification */}
      {showInput && (
        <ChatInput onSend={sendThesis} disabled={isStreaming} />
      )}
    </div>
  );
}

function EmptyState({
  onSelect,
  disabled,
}: {
  onSelect: (thesis: string) => void;
  disabled: boolean;
}) {
  const examples = [
    "I think AI will dominate the market over the next 2 years",
    "I want to invest in renewable energy, I have $5000",
    "I think big tech is cheap after the recent correction",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-white rounded-3xl shrink mr-4 border border-zinc-200">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
          <TrendingUp className="w-8 h-8 text-blue-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-zinc-900 mb-2">TradeMind AI</h2>
      <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
        Write your investment thesis in natural language and I will convert it into
        a quantified, backtested strategy.
      </p>
      <div className="mt-6 space-y-2 w-full max-w-sm">
        {examples.map((example) => (
          <button
            key={example}
            onClick={() => onSelect(example)}
            disabled={disabled}
            className="w-full text-left text-xs text-zinc-600 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 rounded-xl px-4 py-3 transition-all disabled:opacity-50"
          >
            &ldquo;{example}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}
