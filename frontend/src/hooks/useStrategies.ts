"use client";

import { useCallback, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { listStrategies } from "@/services/api";

export function useStrategies() {
  const { savedStrategies, setSavedStrategies } = useAppStore();

  const refresh = useCallback(async () => {
    try {
      const strategies = await listStrategies();
      setSavedStrategies(strategies);
    } catch {
      // ignore
    }
  }, [setSavedStrategies]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { strategies: savedStrategies, refresh };
}
