"use client";

import { AgentStream } from "./AgentStream";
import { PortfolioDashboard } from "./PortfolioDashboard";
import { ActivityLog } from "./ActivityLog";
import { StrategyApprovalOverlay } from "./StrategyApprovalOverlay";
import { useLiveTrading } from "@/hooks/useLiveTrading";
import type { Scenario } from "@/services/mockLiveTrading";

interface LiveLayoutProps {
  scenario?: Scenario;
}

export function LiveLayout({ scenario = "bull" }: LiveLayoutProps) {
  const { status, portfolio, agentMessages, tradeLog, strategyLog, pendingChange, approve } =
    useLiveTrading(scenario);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-zinc-200 bg-white">
        <div className={`w-2 h-2 rounded-full ${status === "running" ? "bg-green-400 animate-pulse" : "bg-amber-400"}`} />
        <span className="text-sm text-zinc-600">
          {status === "running" ? "Live Trading Active" : "⚠ Trading paused — awaiting approval"}
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
