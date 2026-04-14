"use client";

import Link from "next/link";
import { TrendingUp, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="h-14 border-b border-white/[0.06] bg-[var(--bg-surface)]/80 backdrop-blur-xl flex items-center justify-between px-6 relative z-50">
      <Link href="/app" className="flex items-center gap-2.5 group">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <Sparkles className="w-2.5 h-2.5 text-violet-400 absolute -top-0.5 -right-0.5" />
        </div>
        <span className="text-lg font-semibold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          TradeMind AI
        </span>
      </Link>
      <nav className="flex items-center gap-1">
        <Link
          href="/app"
          className="text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
        >
          Nueva Estrategia
        </Link>
        <Link
          href="/strategies"
          className="text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
        >
          Mis Estrategias
        </Link>
        <Link
          href="/live/demo?scenario=rotation"
          className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          Live Trading
        </Link>
      </nav>
    </header>
  );
}
