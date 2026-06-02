"""RAG database layer — knowledge chunks + chat history.

Mirrors apps/rag/src/db.ts. Full-text search via PostgreSQL tsvector/tsquery
(no external embedding API). Reuses the shared asyncpg pool from api.db.
"""
from __future__ import annotations

import asyncpg

from .. import db as _db


async def _execute(query: str, *args) -> str:
    return await _db.pool().execute(query, *args)


async def _fetch(query: str, *args) -> list[asyncpg.Record]:
    return await _db.pool().fetch(query, *args)


async def _fetchrow(query: str, *args) -> asyncpg.Record | None:
    return await _db.pool().fetchrow(query, *args)


async def ensure_rag_tables() -> None:
    await _execute(
        """
        CREATE TABLE IF NOT EXISTS exercise_knowledge (
          id TEXT PRIMARY KEY,
          exercise_id TEXT NOT NULL,
          chunk_type TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          content_tsv TSVECTOR,
          created_at TIMESTAMPTZ DEFAULT now()
        )
        """
    )
    await _execute(
        "CREATE INDEX IF NOT EXISTS idx_knowledge_tsv ON exercise_knowledge USING GIN (content_tsv)"
    )
    await _execute(
        """
        CREATE TABLE IF NOT EXISTS rag_chat_history (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL REFERENCES profiles(email),
          session_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          sources JSONB DEFAULT '[]',
          created_at TIMESTAMPTZ DEFAULT now()
        )
        """
    )
    try:
        await _execute("ALTER TABLE exercise_knowledge DROP COLUMN IF EXISTS embedding")
    except Exception:
        pass


async def get_knowledge_chunk_count() -> int:
    row = await _fetchrow("SELECT count(*)::int AS n FROM exercise_knowledge")
    return row["n"]


async def insert_knowledge_chunk(
    id: str, exercise_id: str, chunk_type: str, title: str, content: str
) -> None:
    await _execute(
        """
        INSERT INTO exercise_knowledge (id, exercise_id, chunk_type, title, content, content_tsv)
        VALUES ($1, $2, $3, $4, $5, to_tsvector('english', $4 || ' ' || $5))
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          content_tsv = to_tsvector('english', EXCLUDED.title || ' ' || EXCLUDED.content)
        """,
        id, exercise_id, chunk_type, title, content,
    )


async def get_all_knowledge_chunks() -> list[dict]:
    rows = await _fetch(
        """
        SELECT id, exercise_id, chunk_type, title, content, created_at
        FROM exercise_knowledge
        ORDER BY exercise_id, chunk_type
        """
    )
    return [
        {
            "id": r["id"], "exerciseId": r["exercise_id"], "chunkType": r["chunk_type"],
            "title": r["title"], "content": r["content"], "createdAt": r["created_at"],
        }
        for r in rows
    ]


async def get_knowledge_chunk(id: str) -> dict | None:
    row = await _fetchrow(
        """
        SELECT id, exercise_id, chunk_type, title, content, created_at
        FROM exercise_knowledge WHERE id = $1
        """,
        id,
    )
    if not row:
        return None
    return {
        "id": row["id"], "exerciseId": row["exercise_id"], "chunkType": row["chunk_type"],
        "title": row["title"], "content": row["content"], "createdAt": row["created_at"],
    }


async def update_knowledge_chunk(id: str, title: str, content: str) -> None:
    await _execute(
        """
        UPDATE exercise_knowledge
        SET title = $1, content = $2, content_tsv = to_tsvector('english', $1 || ' ' || $2)
        WHERE id = $3
        """,
        title, content, id,
    )


async def delete_knowledge_chunk(id: str) -> None:
    await _execute("DELETE FROM exercise_knowledge WHERE id = $1", id)


async def search_similar_chunks(query: str, top_k: int) -> list[dict]:
    rows = await _fetch(
        """
        SELECT id, exercise_id, chunk_type, title, content,
               ts_rank(content_tsv, websearch_to_tsquery('english', $1)) AS similarity
        FROM exercise_knowledge
        WHERE content_tsv @@ websearch_to_tsquery('english', $1)
        ORDER BY similarity DESC
        LIMIT $2
        """,
        query, top_k,
    )
    return [
        {
            "id": r["id"], "exerciseId": r["exercise_id"], "chunkType": r["chunk_type"],
            "title": r["title"], "content": r["content"], "similarity": r["similarity"],
        }
        for r in rows
    ]


async def save_chat_message(
    id: str, email: str, session_id: str, role: str, content: str, sources: list | None = None
) -> None:
    await _execute(
        """
        INSERT INTO rag_chat_history (id, email, session_id, role, content, sources)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        """,
        id, email, session_id, role, content, sources or [],
    )


async def get_chat_history(email: str, session_id: str) -> list[dict]:
    rows = await _fetch(
        """
        SELECT * FROM rag_chat_history
        WHERE email = $1 AND session_id = $2
        ORDER BY created_at ASC
        """,
        email, session_id,
    )
    return [
        {
            "id": r["id"], "role": r["role"], "content": r["content"],
            "sources": r["sources"] or [], "createdAt": r["created_at"],
        }
        for r in rows
    ]
