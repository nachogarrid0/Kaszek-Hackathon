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
    <div className="flex flex-col h-full glass rounded-2xl overflow-hidden border border-white/[0.08]">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2.5 bg-white/[0.02]">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
        <h2 className="text-sm font-semibold text-white">Razonamiento del Agente</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500 italic">El agente está iniciando...</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 mb-1">{msg.timestamp}</p>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3">
                <p className="text-sm text-zinc-300 leading-relaxed">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
