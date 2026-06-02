"""Workout log endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Body, Depends
from fastapi.responses import JSONResponse

from .. import db
from ..auth import require_user

router = APIRouter()


@router.get("/api/workout-log")
async def list_workout_log(limit: int = 0, email: str = Depends(require_user)):
    return await db.get_workout_log(email, limit)


@router.post("/api/workout-log")
async def create_workout_log(body: dict = Body(default={}), email: str = Depends(require_user)):
    entry_id = body.get("id") or str(uuid.uuid4())
    entry = await db.create_workout_log(email, body, entry_id)
    return {"ok": True, "entry": entry}


@router.get("/api/workout-log/{entry_id}")
async def get_workout_log_entry(entry_id: str, email: str = Depends(require_user)):
    entry = await db.get_workout_log_entry(email, entry_id)
    if not entry:
        return JSONResponse({"error": "Log entry not found"}, status_code=404)
    return entry
