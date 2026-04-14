"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";

export function Header() {
  return (
    <header className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-6">
      <Link href="/app" className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        <span className="text-lg font-semibold text-zinc-900">TradeMind AI</span>
      </Link>
      <nav className="flex items-center gap-4">
        <Link
          href="/app"
          className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          New Strategy
        </Link>
        <Link
          href="/strategies"
          className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          My Strategies
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
