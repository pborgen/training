"""Generation step of RAG — Claude on AWS Bedrock with retrieved context.

Mirrors apps/rag/src/generation.ts: same model, system prompt, message format.
Uses the anthropic SDK's AnthropicBedrock client (the Python equivalent of
@anthropic-ai/bedrock-sdk). Credentials resolve via the standard AWS chain.
"""
from __future__ import annotations

import asyncio

from anthropic import AnthropicBedrock

from .. import config

_client = AnthropicBedrock(aws_region=config.AWS_REGION)

# Bedrock model id (cross-region inference profile). Defaults to Claude 3.5
# Haiku — the cheapest Claude — and is configurable via RAG_MODEL_ID.
MODEL_ID = config.RAG_MODEL_ID

SYSTEM_PROMPT = """You are a knowledgeable fitness coach and exercise expert. You answer questions about exercises, form, programming, and training.

IMPORTANT RULES:
- Base your answers ONLY on the provided context documents. Do not make up information.
- If the context doesn't contain enough information to fully answer the question, say so honestly.
- When referencing information, mention which exercise and topic it comes from.
- Keep answers concise but thorough. Use bullet points for lists.
- If asked about an exercise not in the context, say you don't have information about that specific exercise."""


def _generate_sync(query: str, chunks: list[dict], chat_history: list[dict]) -> dict:
    context_block = "\n\n---\n\n".join(
        f"[Source {i + 1}: {c['title']} (similarity: {c['similarity']:.2f})]\n{c['content']}"
        for i, c in enumerate(chunks)
    )

    messages = [
        {"role": m["role"], "content": m["content"]} for m in chat_history
    ]
    messages.append(
        {
            "role": "user",
            "content": (
                "Here are relevant documents from the exercise knowledge base:\n\n"
                f"{context_block}\n\n"
                "---\n\n"
                "Based on the above context, please answer this question:\n"
                f"{query}"
            ),
        }
    )

    response = _client.messages.create(
        model=MODEL_ID,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages,
    )

    first = response.content[0]
    answer = first.text if getattr(first, "type", None) == "text" else ""

    sources = [
        {
            "chunkId": c["id"],
            "exerciseId": c["exerciseId"],
            "chunkType": c["chunkType"],
            "title": c["title"],
            "similarity": c["similarity"],
        }
        for c in chunks
    ]
    return {"answer": answer, "sources": sources}


async def generate_answer(
    query: str, chunks: list[dict], chat_history: list[dict] | None = None
) -> dict:
    # The anthropic Bedrock client is synchronous; run it off the event loop.
    return await asyncio.to_thread(_generate_sync, query, chunks, chat_history or [])
