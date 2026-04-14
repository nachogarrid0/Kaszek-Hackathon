from __future__ import annotations

from datetime import datetime, timezone


class InMemoryStore:
    def __init__(self):
        self._sessions: dict[str, dict] = {}
        self._strategies: dict[str, dict] = {}

    # --- Sessions (active agent runs) ---

    def create_session(self, session_id: str, thesis: str):
        self._sessions[session_id] = {
            "id": session_id,
            "thesis": thesis,
            "status": "running",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "data": {},
        }

    def update_session(self, session_id: str, data: dict):
        if session_id in self._sessions:
            self._sessions[session_id]["data"].update(data)

    def get_session(self, session_id: str) -> dict | None:
        return self._sessions.get(session_id)

    def finalize_session(self, session_id: str):
        session = self._sessions.get(session_id)
        if not session:
            return

        session["status"] = "completed"

        # Save as strategy
        self._strategies[session_id] = {
            "id": session_id,
            "thesis": session["thesis"],
            "status": "completed",
            "approved": False,
            "created_at": session["created_at"],
            "assets": session["data"].get("dashboard_assets"),
            "metrics": session["data"].get("last_backtest", {}).get("metrics"),
            "equity_curve": session["data"].get("last_backtest", {}).get("equity_curve"),
            "strategy_params": session["data"].get("strategy_params"),
            "benchmark_comparison": session["data"].get("benchmark_comparison"),
            "reasoning": None,
        }

    # --- Strategies ---

    def get_strategy(self, strategy_id: str) -> dict | None:
        return self._strategies.get(strategy_id)

    def approve_strategy(self, strategy_id: str) -> dict | None:
        strategy = self._strategies.get(strategy_id)
        if not strategy:
            return None
        strategy["approved"] = True
        strategy["approved_at"] = datetime.now(timezone.utc).isoformat()
        return {"status": "approved", "saved_at": strategy["approved_at"]}

    def list_strategies(self) -> list[dict]:
        return list(self._strategies.values())


store = InMemoryStore()
