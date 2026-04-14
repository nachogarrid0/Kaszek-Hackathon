"use client";

import { AgentStream } from "./AgentStream";
import { PortfolioDashboard } from "./PortfolioDashboard";
import { ActivityLog } from "./ActivityLog";
import { StrategyApprovalOverlay } from "./StrategyApprovalOverlay";
import { useLiveTrading } from "@/hooks/useLiveTrading";

interface LiveLayoutProps {
  strategyId: string;
}

export function LiveLayout({ strategyId }: LiveLayoutProps) {
  const { status, portfolio, agentMessages, tradeLog, strategyLog, pendingChange, approve } =
    useLiveTrading(strategyId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.06] bg-[var(--bg-surface)]">
        <div className={`w-2 h-2 rounded-full ${status === "running" ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"}`} />
        <span className="text-sm text-zinc-300 font-medium tracking-wide">
          {status === "running" ? "Live Trading Activo" : "⚠ Trading pausado — esperando aprobación"}
        </span>
      </div>

      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        <div className="w-1/4 min-w-0">
          <AgentStream messages={agentMessages} />
        </div>

        <div className="flex-1 min-w-0 relative">
          <PortfolioDashboard portfolio={portfolio} />
          {status === "awaiting_approval" && pendingChange && (
            <StrategyApprovalOverlay pending={pendingChange} onApprove={approve} />
          )}
        </div>

        <div className="w-1/4 min-w-0">
          <ActivityLog tradeLog={tradeLog} strategyLog={strategyLog} />
        </div>
      </div>
    </div>
  );
}
