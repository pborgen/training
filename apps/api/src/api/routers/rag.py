"""RAG exercise coach endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Body, Depends
from fastapi.responses import JSONResponse

from ..auth import require_admin, require_user
from ..rag import db as rag_db
from ..rag.embeddings import seed_knowledge_base
from ..rag.generation import generate_answer
from ..rag.retrieval import retrieve_relevant_chunks

router = APIRouter()


@router.get("/api/rag/status")
async def rag_status(_: str = Depends(require_user)):
    chunk_count = await rag_db.get_knowledge_chunk_count()
    return {"seeded": chunk_count > 0, "chunkCount": chunk_count}


@router.post("/api/rag/seed")
async def rag_seed(_: str = Depends(require_admin)):
    print("Seeding RAG knowledge base...")
    result = await seed_knowledge_base()
    return {"ok": True, **result}


@router.post("/api/rag/chat")
async def rag_chat(body: dict = Body(default={}), email: str = Depends(require_user)):
    message = (body.get("message") or "").strip()
    if not message:
        return JSONResponse({"error": "Message required"}, status_code=400)

    existing_session_id = body.get("sessionId")
    session_id = existing_session_id or str(uuid.uuid4())

    history = []
    if existing_session_id:
        history = [
            {"role": m["role"], "content": m["content"]}
            for m in await rag_db.get_chat_history(email, session_id)
        ]

    chunks = await retrieve_relevant_chunks(message, 5)
    result = await generate_answer(message, chunks, history)
    answer, sources = result["answer"], result["sources"]

    await rag_db.save_chat_message(str(uuid.uuid4()), email, session_id, "user", message)
    await rag_db.save_chat_message(str(uuid.uuid4()), email, session_id, "assistant", answer, sources)

    return {"answer": answer, "sources": sources, "sessionId": session_id}


@router.get("/api/rag/chat/{session_id}")
async def rag_chat_history(session_id: str, email: str = Depends(require_user)):
    return await rag_db.get_chat_history(email, session_id)
