"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import type { ClarificationQuestion } from "@/types";

interface ClarificationFormProps {
    onSubmit: (answers: Record<string, string>) => void;
    disabled?: boolean;
}

export function ClarificationForm({ onSubmit, disabled }: ClarificationFormProps) {
    const { clarificationQuestions, clarificationAnswers, setClarificationAnswer } =
        useAppStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        setIsSubmitting(true);
        onSubmit(clarificationAnswers);
    };

    const allRequiredAnswered = clarificationQuestions
        .filter((q) => q.required)
        .every((q) => clarificationAnswers[q.id]?.trim());

    return (
        <div className="animate-in space-y-4 px-2">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-xs font-medium text-zinc-400">
                    Responde estas preguntas para personalizar tu análisis
                </p>
            </div>

            <div className="space-y-3">
                {clarificationQuestions.map((q) => (
                    <QuestionField
                        key={q.id}
                        question={q}
                        value={clarificationAnswers[q.id] || ""}
                        onChange={(val) => setClarificationAnswer(q.id, val)}
                        disabled={disabled || isSubmitting}
                    />
                ))}
            </div>

            <button
                onClick={handleSubmit}
                disabled={!allRequiredAnswered || disabled || isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium hover:from-blue-500 hover:to-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Iniciando análisis...
                    </>
                ) : (
                    <>
                        Comenzar Análisis
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
            </button>
        </div>
    );
}

function QuestionField({
    question,
    value,
    onChange,
    disabled,
}: {
    question: ClarificationQuestion;
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
}) {
    return (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 transition-all hover:border-white/20">
            <label className="block text-sm font-medium text-zinc-200 mb-2">
                {question.question}
                {question.required && <span className="text-violet-400 ml-1">*</span>}
            </label>

            {question.type === "select" && question.options ? (
                <div className="grid grid-cols-1 gap-2">
                    {question.options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => onChange(opt)}
                            disabled={disabled}
                            className={`text-left text-sm px-4 py-2.5 rounded-lg border transition-all ${value === opt
                                    ? "bg-gradient-to-r from-blue-600/20 to-violet-600/20 border-blue-500/40 text-white"
                                    : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-300"
                                } disabled:opacity-50`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            ) : question.type === "number" ? (
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={question.placeholder || ""}
                    disabled={disabled}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={question.placeholder || ""}
                    disabled={disabled}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent disabled:opacity-50"
                />
            )}
        </div>
    );
}
