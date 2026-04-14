"use client";

import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";

interface AgentStreamProps {
  messages: { content: string; timestamp: string }[];
}

export function AgentStream({ messages }: AgentStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <h2 className="text-xs font-medium text-zinc-500">Agent Reasoning</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-zinc-400 italic">Agent is starting...</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3 h-3 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-0.5">{msg.timestamp}</p>
              <p className="text-sm text-zinc-700 leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
