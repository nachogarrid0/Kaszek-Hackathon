"use client";

import type { ChatMessage as ChatMessageType } from "@/types";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser
            ? "bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20"
            : "bg-white/10 border border-white/10"
          }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-zinc-400" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser
            ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-tr-sm shadow-lg shadow-blue-500/10"
            : "glass text-zinc-200 rounded-tl-sm"
          }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
