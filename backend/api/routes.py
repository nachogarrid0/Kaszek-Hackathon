import uuid

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from api.schemas import (
    AgentRunRequest,
    AgentClarifyRequest,
    AgentRunWithContextRequest,
    ClarifyAnswersRequest,
    StrategyResponse,
)
from agent.orchestrator import run_agent, generate_clarification_questions
from agent.live_trading import live_trading_stream
from store.memory import store

router = APIRouter()


@router.post("/agent/clarify")
async def agent_clarify(req: AgentClarifyRequest):
    """Phase 0: Generate clarification questions for the user's thesis."""
    session_id = str(uuid.uuid4())[:8]

    questions = await generate_clarification_questions(req.thesis)

    store.create_clarification(session_id, req.thesis, questions)

    return {
        "session_id": session_id,
        "thesis": req.thesis,
        **questions,
    }


@router.post("/agent/clarify/answers")
async def agent_clarify_answers(req: ClarifyAnswersRequest):
    """Save the user's answers to the clarification questions."""
    clarification = store.get_clarification(req.session_id)
    if not clarification:
        raise HTTPException(status_code=404, detail="Clarification session not found")

    store.set_clarification_answers(req.session_id, req.answers)
    return {"status": "ok", "session_id": req.session_id}


@router.post("/agent/run-with-context")
async def agent_run_with_context(req: AgentRunWithContextRequest):
    """Run the agent with enriched context from the clarification phase."""
    clarification = store.get_clarification(req.session_id)
    if not clarification:
        raise HTTPException(status_code=404, detail="Clarification session not found")

    thesis = clarification["thesis"]
    answers = clarification.get("answers", {})
    questions = clarification.get("questions", {})

    # Build enriched thesis with the user's answers
    enriched_parts = [f"Mi tesis de inversión: {thesis}\n"]
    enriched_parts.append("Información adicional del inversor:")

    question_list = questions.get("questions", [])
    for q in question_list:
        qid = q.get("id", "")
        answer = answers.get(qid, "No respondido")
        enriched_parts.append(f"- {q.get('question', qid)}: {answer}")

    enriched_context = "\n".join(enriched_parts)

    return StreamingResponse(
        run_agent(thesis, enriched_context=enriched_context),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


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


@router.get("/live/{strategy_id}/stream")
async def live_stream(strategy_id: str):
    """Start a real-time SSE stream for Live Trading."""
    return StreamingResponse(
        live_trading_stream(strategy_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/live/{strategy_id}/approve")
async def live_approve(strategy_id: str, approved: bool = True):
    """Approve or reject a live strategy rotation."""
    # En una iteración futura esto afectaría la bandera de aprobación en la memoria del strategy session
    # por ahora devolvemos OK para el flow.
    return {"status": "ok", "approved": approved}
