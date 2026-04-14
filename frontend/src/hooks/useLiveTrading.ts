import { useEffect, useRef, useState, useCallback } from "react";
import type {
  Portfolio,
  TradeLogEntry,
  StrategyLogEntry,
  PendingStrategyChange,
  LiveEvent,
} from "@/types/live";
import { startLiveTradingStream, approveLiveTradingStrategy } from "@/services/api";

export interface LiveTradingHook {
  status: "running" | "awaiting_approval";
  portfolio: Portfolio;
  agentMessages: { content: string; timestamp: string }[];
  tradeLog: TradeLogEntry[];
  strategyLog: StrategyLogEntry[];
  pendingChange: PendingStrategyChange | undefined;
  approve: (approved: boolean) => void;
}

function nowStr(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

export function useLiveTrading(strategyId: string): LiveTradingHook {
  const [status, setStatus] = useState<"running" | "awaiting_approval">("running");
  const [portfolio, setPortfolio] = useState<Portfolio>({
    total_pnl: 0,
    total_pnl_pct: 0,
    daily_return: 0,
    capital_at_risk: 0,
    positions: [],
    allocation_pie: [],
    gains_pie: [],
  });
  const [agentMessages, setAgentMessages] = useState<{ content: string; timestamp: string }[]>([]);
  const [tradeLog, setTradeLog] = useState<TradeLogEntry[]>([]);
  const [strategyLog, setStrategyLog] = useState<StrategyLogEntry[]>([
    { type: "loaded", message: "Initial strategy loaded", timestamp: nowStr() },
  ]);
  const [pendingChange, setPendingChange] = useState<PendingStrategyChange | undefined>();

  const stopFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!strategyId) return;

    let mounted = true;

    startLiveTradingStream(strategyId, (event, data) => {
      if (!mounted) return;
      const liveEvent = { event, data } as unknown as LiveEvent;

      if (liveEvent.event === "agent_message") {
        setAgentMessages((prev) => [...prev, liveEvent.data]);
      } else if (liveEvent.event === "trade_executed") {
        setTradeLog((prev) => [liveEvent.data, ...prev]);
      } else if (liveEvent.event === "portfolio_update") {
        setPortfolio(liveEvent.data);
      } else if (liveEvent.event === "strategy_obsolete") {
        setPendingChange(liveEvent.data);
        setStatus("awaiting_approval");
        setStrategyLog((prev) => [
          ...prev,
          { type: "obsolete", message: "Agent detected obsolescence → awaiting approval", timestamp: nowStr() },
        ]);
      }
    }).then(({ stop }) => {
      if (!mounted) stop();
      else stopFnRef.current = stop;
    });

    return () => {
      mounted = false;
      if (stopFnRef.current) stopFnRef.current();
    };
  }, [strategyId]);

  const approve = useCallback(
    async (approved: boolean) => {
      try {
        await approveLiveTradingStrategy(strategyId, approved);
        setPendingChange(undefined);
        setStatus("running");
        setStrategyLog((prev) => [
          ...prev,
          approved
            ? { type: "approved", message: "User approved → new strategy active", timestamp: nowStr() }
            : { type: "rejected", message: "User rejected → previous strategy maintained", timestamp: nowStr() },
        ]);
      } catch (err) {
        console.error("Failed to approve live trading", err);
      }
    },
    [strategyId]
  );

  return { status, portfolio, agentMessages, tradeLog, strategyLog, pendingChange, approve };
}
