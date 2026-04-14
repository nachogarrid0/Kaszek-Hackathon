"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/appStore";
import { useAgent } from "@/hooks/useAgent";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ThinkingStep } from "./ThinkingStep";
import { TrendingUp } from "lucide-react";

export function ChatContainer() {
  const { messages, isStreaming, currentThinkingStep } = useAppStore();
  const { sendThesis } = useAgent();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentThinkingStep]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">
              TradeMind AI
            </h2>
            <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
              Escribi tu tesis de inversion en lenguaje natural y voy a
              convertirla en una estrategia cuantificada y backtestada.
            </p>
            <div className="mt-6 space-y-2 w-full max-w-sm">
              {[
                "Creo que la IA va a dominar el mercado los proximos 2 anos",
                "Quiero invertir en energia renovable, tengo $5000",
                "Creo que las big tech estan baratas despues de la correccion",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => sendThesis(example)}
                  disabled={isStreaming}
                  className="w-full text-left text-xs text-zinc-500 bg-zinc-50 hover:bg-zinc-100 rounded-lg px-4 py-3 transition-colors disabled:opacity-50"
                >
                  &ldquo;{example}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {currentThinkingStep && (
              <ThinkingStep step={currentThinkingStep} />
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={sendThesis} disabled={isStreaming} />
    </div>
  );
}
