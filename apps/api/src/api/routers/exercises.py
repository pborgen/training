"""Catalog + user exercise endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Body, Depends
from fastapi.responses import JSONResponse

from .. import db
from ..auth import require_user

router = APIRouter()


@router.get("/api/exercises")
async def catalog():
    return await db.get_catalog_exercises()


@router.get("/api/user-exercises")
async def list_user_exercises(email: str = Depends(require_user)):
    return await db.get_user_exercises(email)


@router.post("/api/user-exercises")
async def create_user_exercise(body: dict = Body(default={}), email: str = Depends(require_user)):
    ex_id = body.get("id") or str(uuid.uuid4())
    exercise = await db.create_user_exercise(email, body, ex_id)
    return {"ok": True, "exercise": exercise}


@router.put("/api/user-exercises/{ex_id}")
async def update_user_exercise(ex_id: str, body: dict = Body(default={}), email: str = Depends(require_user)):
    exercise = await db.update_user_exercise(email, ex_id, body)
    if not exercise:
        return JSONResponse({"error": "Exercise not found"}, status_code=404)
    return {"ok": True, "exercise": exercise}


@router.delete("/api/user-exercises/{ex_id}")
async def delete_user_exercise(ex_id: str, email: str = Depends(require_user)):
    await db.delete_user_exercise(email, ex_id)
    return {"ok": True}
