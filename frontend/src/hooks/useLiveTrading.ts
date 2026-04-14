import { useEffect, useRef, useState, useCallback } from "react";
import type {
  Portfolio,
  TradeLogEntry,
  StrategyLogEntry,
  PendingStrategyChange,
} from "@/types/live";
import {
  startMockSession,
  getInitialPortfolio,
  type Scenario,
  type MockSession,
} from "@/services/mockLiveTrading";

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

export function useLiveTrading(scenario: Scenario = "bull"): LiveTradingHook {
  const [status, setStatus] = useState<"running" | "awaiting_approval">("running");
  const [portfolio, setPortfolio] = useState<Portfolio>(() => getInitialPortfolio(scenario));
  const [agentMessages, setAgentMessages] = useState<{ content: string; timestamp: string }[]>([]);
  const [tradeLog, setTradeLog] = useState<TradeLogEntry[]>([]);
  const [strategyLog, setStrategyLog] = useState<StrategyLogEntry[]>([
    { type: "loaded", message: "Initial strategy loaded", timestamp: nowStr() },
  ]);
  const [pendingChange, setPendingChange] = useState<PendingStrategyChange | undefined>();
  const sessionRef = useRef<MockSession | null>(null);

  useEffect(() => {
    const session = startMockSession(scenario, (event) => {
      if (event.event === "agent_message") {
        setAgentMessages((prev) => [...prev, event.data]);
      } else if (event.event === "trade_executed") {
        setTradeLog((prev) => [event.data, ...prev]);
      } else if (event.event === "portfolio_update") {
        setPortfolio(event.data);
      } else if (event.event === "strategy_obsolete") {
        setPendingChange(event.data);
        setStatus("awaiting_approval");
        setStrategyLog((prev) => [
          ...prev,
          { type: "obsolete", message: "Agent detected obsolescence → awaiting approval", timestamp: nowStr() },
        ]);
      }
    });
    sessionRef.current = session;
    return () => session.stop();
  }, [scenario]);

  const approve = useCallback((approved: boolean) => {
    sessionRef.current?.approve(approved);
    setPendingChange(undefined);
    setStatus("running");
    setStrategyLog((prev) => [
      ...prev,
      approved
        ? { type: "approved", message: "User approved → new strategy active", timestamp: nowStr() }
        : { type: "rejected", message: "User rejected → previous strategy maintained", timestamp: nowStr() },
    ]);
  }, []);

  return { status, portfolio, agentMessages, tradeLog, strategyLog, pendingChange, approve };
}
