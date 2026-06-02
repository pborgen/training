"""Retrieval step of RAG — PostgreSQL full-text search over knowledge chunks."""
from __future__ import annotations

from . import db


async def retrieve_relevant_chunks(
    query: str, top_k: int = 5, min_similarity: float = 0.0
) -> list[dict]:
    results = await db.search_similar_chunks(query, top_k)
    return [c for c in results if c["similarity"] >= min_similarity]
