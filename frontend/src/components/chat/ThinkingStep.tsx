"use client";

import { Loader2, Check, X, Wrench } from "lucide-react";
import type { ToolProgress } from "@/stores/appStore";

interface ThinkingStepProps {
  step: string;
  toolProgress?: ToolProgress | null;
}

export function ThinkingStep({ step, toolProgress }: ThinkingStepProps) {
  if (toolProgress) {
    return (
      <div className="flex items-start gap-3 px-4 py-3 bg-zinc-50 rounded-lg mx-2">
        <div className="flex-shrink-0 mt-0.5">
          {toolProgress.status === "running" ? (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          ) : toolProgress.status === "done" ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <X className="w-4 h-4 text-red-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Wrench className="w-3 h-3 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-700">{toolProgress.message}</span>
          </div>
          {toolProgress.inputPreview && (
            <p className="text-xs text-zinc-400 mt-0.5 truncate">{toolProgress.inputPreview}</p>
          )}
          {toolProgress.resultPreview && toolProgress.status !== "running" && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">{toolProgress.resultPreview}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
      <span className="text-sm text-zinc-500 italic">{step}</span>
    </div>
  );
}
