from __future__ import annotations

from pydantic import BaseModel


class AgentRunRequest(BaseModel):
    thesis: str


class AgentClarifyRequest(BaseModel):
    thesis: str


class AgentRunWithContextRequest(BaseModel):
    session_id: str


class ClarifyAnswersRequest(BaseModel):
    session_id: str
    answers: dict[str, str]


class ApproveRequest(BaseModel):
    pass


class StrategyResponse(BaseModel):
    id: str
    thesis: str
    status: str
    assets: list[dict] | None = None
    metrics: dict | None = None
    equity_curve: dict | None = None
    strategy_params: dict | None = None
    reasoning: str | None = None
    approved: bool = False
    created_at: str | None = None
