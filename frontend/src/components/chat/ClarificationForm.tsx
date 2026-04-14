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
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-zinc-600">
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
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
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
        <div className="bg-white rounded-xl border border-zinc-200 p-4 transition-all hover:border-zinc-300 shadow-sm">
            <label className="block text-sm font-medium text-zinc-700 mb-2">
                {question.question}
                {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {question.type === "select" && question.options ? (
                <div className="grid grid-cols-1 gap-2">
                    {question.options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => onChange(opt)}
                            disabled={disabled}
                            className={`text-left text-sm px-4 py-2.5 rounded-lg border transition-all ${value === opt
                                ? "bg-blue-50 border-blue-500 text-blue-700 font-medium"
                                : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-white hover:border-zinc-300"
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
                    className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={question.placeholder || ""}
                    disabled={disabled}
                    className="w-full px-4 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent disabled:opacity-50"
                />
            )}
        </div>
    );
}
