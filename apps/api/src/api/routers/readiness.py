"""Readiness check-in endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Body, Depends
from fastapi.responses import JSONResponse

from .. import db
from ..auth import require_user

router = APIRouter()


@router.get("/api/readiness")
async def list_readiness(limit: int = 0, email: str = Depends(require_user)):
    return await db.get_readiness_checkins(email, limit)


@router.post("/api/readiness")
async def create_readiness(body: dict = Body(default={}), email: str = Depends(require_user)):
    checkin_id = body.get("id") or str(uuid.uuid4())
    checkin = await db.create_readiness_checkin(email, body, checkin_id)
    return {"ok": True, "checkin": checkin}


@router.put("/api/readiness/{checkin_id}")
async def update_readiness(checkin_id: str, body: dict = Body(default={}), email: str = Depends(require_user)):
    checkin = await db.update_readiness_checkin(email, checkin_id, body)
    if not checkin:
        return JSONResponse({"error": "Not found"}, status_code=404)
    return {"ok": True, "checkin": checkin}


@router.delete("/api/readiness/{checkin_id}")
async def delete_readiness(checkin_id: str, email: str = Depends(require_user)):
    await db.delete_readiness_checkin(email, checkin_id)
    return {"ok": True}
