"use client";

import { useAppStore } from "@/stores/appStore";
import { Loader2, Check, X, Wrench, Brain, Zap } from "lucide-react";

export function AgentProgress() {
    const { isStreaming, currentStatusText, toolProgress, completedSteps, phase } =
        useAppStore();

    if (!isStreaming || phase !== "analyzing") return null;

    return (
        <div className="animate-in px-2 space-y-2">
            {/* Completed steps - condensed */}
            {completedSteps.length > 0 && (
                <div className="space-y-1">
                    {completedSteps.map((step) => (
                        <div
                            key={step.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 text-xs"
                        >
                            {step.ok ? (
                                <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            ) : (
                                <X className="w-3 h-3 text-red-500 flex-shrink-0" />
                            )}
                            <span className="text-zinc-600 truncate">{step.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Current tool in progress */}
            {toolProgress && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="flex-shrink-0 mt-0.5">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <Wrench className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium text-zinc-900">
                                {toolProgress.message}
                            </span>
                        </div>
                        {toolProgress.inputPreview && (
                            <p className="text-[10px] text-zinc-500 mt-1 truncate">
                                {toolProgress.inputPreview}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Status text without tool — agent is thinking */}
            {!toolProgress && currentStatusText && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 shadow-sm">
                    <div className="relative">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <Zap className="w-2 h-2 text-amber-500 absolute -top-0.5 -right-0.5 animate-pulse" />
                    </div>
                    <span className="text-xs text-zinc-600 italic font-medium">{currentStatusText}</span>
                </div>
            )}

            {/* Pulsing animation when active but no specific status */}
            {!toolProgress && !currentStatusText && (
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"
                                style={{ animationDelay: `${i * 200}ms` }}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-zinc-500 italic">
                        Analyzing...
                    </span>
                </div>
            )}
        </div>
    );
}
