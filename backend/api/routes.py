from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from api.schemas import AgentRunRequest, StrategyResponse
from agent.orchestrator import run_agent
from store.memory import store

router = APIRouter()


@router.post("/agent/run")
async def agent_run(req: AgentRunRequest):
    return StreamingResponse(
        run_agent(req.thesis),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/strategy/{strategy_id}")
async def get_strategy(strategy_id: str):
    strategy = store.get_strategy(strategy_id)
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strategy


@router.post("/strategy/{strategy_id}/approve")
async def approve_strategy(strategy_id: str):
    result = store.approve_strategy(strategy_id)
    if not result:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return result


@router.get("/strategies")
async def list_strategies():
    return store.list_strategies()
