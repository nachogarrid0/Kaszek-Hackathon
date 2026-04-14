"use client";

import { Loader2 } from "lucide-react";

interface ThinkingStepProps {
  step: string;
}

export function ThinkingStep({ step }: ThinkingStepProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
      <span className="text-sm text-zinc-500 italic">{step}</span>
    </div>
  );
}
