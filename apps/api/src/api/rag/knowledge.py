"""Static exercise knowledge base, loaded from data/knowledge.json.

The JSON was exported verbatim from apps/rag/src/knowledge.ts. Each entry has
exerciseId, chunkType, title, content. 66 chunks (11 exercises x 6 chunk types).
"""
from __future__ import annotations

import json
from pathlib import Path

_DATA = Path(__file__).resolve().parent / "data" / "knowledge.json"

EXERCISE_KNOWLEDGE: list[dict] = json.loads(_DATA.read_text())
