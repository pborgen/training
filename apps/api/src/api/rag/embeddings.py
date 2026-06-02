"""Seed the knowledge base into Postgres with full-text indexing."""
from __future__ import annotations

from . import db
from .knowledge import EXERCISE_KNOWLEDGE


async def seed_knowledge_base() -> dict:
    processed = 0
    for chunk in EXERCISE_KNOWLEDGE:
        chunk_id = f"{chunk['exerciseId']}-{chunk['chunkType']}"
        await db.insert_knowledge_chunk(
            chunk_id, chunk["exerciseId"], chunk["chunkType"], chunk["title"], chunk["content"]
        )
        processed += 1
    total = await db.get_knowledge_chunk_count()
    print(f"Seeding complete: {processed} chunks processed, {total} total in database.")
    return {"chunksProcessed": processed}
