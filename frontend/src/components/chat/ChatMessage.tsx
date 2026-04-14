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
          ? "bg-blue-600 shadow-md shadow-blue-600/20"
          : "bg-blue-50 border border-blue-100"
          }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-blue-600" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser
          ? "bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-600/10"
          : "bg-white border border-zinc-200 text-zinc-700 rounded-tl-sm shadow-sm"
          }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
