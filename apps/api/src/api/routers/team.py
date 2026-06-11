"""Multi-agent coaching team endpoints.

This replaces the single RAG coach as the in-app coach. A supervisor (LangGraph,
in apps/agent) routes each message to specialist agents — workout planning,
nutrition, recovery, and progress — and synthesizes one reply. The specialists'
tools call back into this same API as the authenticated client (via dev auth
headers), so the team must run with ALLOW_DEV_AUTH_HEADERS=true.

The team graph is synchronous, so each turn runs in a threadpool to keep the
event loop free. Chat history reuses the rag_chat_history table.
"""
from __future__ import annotations

import uuid
from functools import lru_cache

from fastapi import APIRouter, Body, Depends
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from agents.common.api import acting_user
from agents.team.supervisor import CoachingTeam

from ..auth import require_user
from ..rag import db as rag_db

router = APIRouter()


@lru_cache(maxsize=1)
def _team() -> CoachingTeam:
    """One shared team for the process. run() is stateless, so it is safe to reuse
    across requests; building it (4 sub-agents + 2 models) is expensive enough to
    do once, lazily on first chat rather than at import time."""
    return CoachingTeam()


def _run_turn(message: str, email: str, history: list[dict]) -> dict:
    with acting_user(email):
        return _team().run(message, history)


@router.post("/api/coach/team/chat")
async def team_chat(body: dict = Body(default={}), email: str = Depends(require_user)):
    message = (body.get("message") or "").strip()
    if not message:
        return JSONResponse({"error": "Message required"}, status_code=400)

    existing_session_id = body.get("sessionId")
    session_id = existing_session_id or str(uuid.uuid4())

    history: list[dict] = []
    if existing_session_id:
        history = [
            {"role": m["role"], "content": m["content"]}
            for m in await rag_db.get_chat_history(email, session_id)
        ]

    result = await run_in_threadpool(_run_turn, message, email, history)
    answer = result["answer"]
    specialists = result["specialists"]

    await rag_db.save_chat_message(str(uuid.uuid4()), email, session_id, "user", message)
    await rag_db.save_chat_message(
        str(uuid.uuid4()), email, session_id, "assistant", answer, specialists
    )

    return {"answer": answer, "specialists": specialists, "sessionId": session_id}


@router.get("/api/coach/team/chat/{session_id}")
async def team_chat_history(session_id: str, email: str = Depends(require_user)):
    rows = await rag_db.get_chat_history(email, session_id)
    # `sources` holds the specialist breakdown for assistant turns.
    return [
        {
            "id": r["id"],
            "role": r["role"],
            "content": r["content"],
            "specialists": r["sources"] or [],
            "createdAt": r["createdAt"],
        }
        for r in rows
    ]
