"""Routine CRUD endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Body, Depends
from fastapi.responses import JSONResponse

from .. import db
from ..auth import require_user

router = APIRouter()


@router.get("/api/routines")
async def list_routines(email: str = Depends(require_user)):
    return await db.get_routines(email)


@router.get("/api/routines/{routine_id}")
async def get_routine(routine_id: str, email: str = Depends(require_user)):
    routine = await db.get_routine(email, routine_id)
    if not routine:
        return JSONResponse({"error": "Routine not found"}, status_code=404)
    return routine


@router.post("/api/routines")
async def create_routine(body: dict = Body(default={}), email: str = Depends(require_user)):
    routine_id = body.get("id") or str(uuid.uuid4())
    routine = await db.create_routine(email, body, routine_id)
    return {"ok": True, "routine": routine}


@router.put("/api/routines/{routine_id}")
async def update_routine(routine_id: str, body: dict = Body(default={}), email: str = Depends(require_user)):
    routine = await db.update_routine(email, routine_id, body)
    if not routine:
        return JSONResponse({"error": "Routine not found"}, status_code=404)
    return {"ok": True, "routine": routine}


@router.delete("/api/routines/{routine_id}")
async def delete_routine(routine_id: str, email: str = Depends(require_user)):
    await db.delete_routine(email, routine_id)
    return {"ok": True}
