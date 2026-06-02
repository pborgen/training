"""Client-facing scheduled workouts + client permission settings."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Body, Depends, Query
from fastapi.responses import JSONResponse

from .. import db
from ..auth import require_user

router = APIRouter()


@router.get("/api/settings/client-permissions")
async def client_permissions():
    self_schedule = await db.get_setting("client_self_schedule")
    return {"clientSelfSchedule": self_schedule != "false"}


@router.get("/api/my-schedule")
async def my_schedule(
    frm: str = Query("2000-01-01", alias="from"),
    to: str = Query("2099-12-31"),
    email: str = Depends(require_user),
):
    return await db.get_scheduled_workouts(email, frm, to)


@router.post("/api/my-schedule")
async def create_my_schedule(body: dict = Body(default={}), email: str = Depends(require_user)):
    self_schedule = await db.get_setting("client_self_schedule")
    if self_schedule == "false":
        return JSONResponse({"error": "Self-scheduling is disabled by your admin"}, status_code=403)
    routine_id = body.get("routineId")
    routine_name = body.get("routineName")
    scheduled_date = body.get("scheduledDate")
    if not routine_id or not routine_name or not scheduled_date:
        return JSONResponse(
            {"error": "routineId, routineName, and scheduledDate are required"}, status_code=400
        )
    entry = await db.create_scheduled_workout(
        str(uuid.uuid4()),
        {
            "clientEmail": email,
            "routineId": routine_id,
            "routineName": routine_name,
            "scheduledDate": scheduled_date,
            "notes": body.get("notes"),
            "createdBy": email,
        },
    )
    return {"ok": True, "entry": entry}


@router.delete("/api/my-schedule/{entry_id}")
async def delete_my_schedule(entry_id: str, email: str = Depends(require_user)):
    self_schedule = await db.get_setting("client_self_schedule")
    if self_schedule == "false":
        return JSONResponse({"error": "Self-scheduling is disabled by your admin"}, status_code=403)
    await db.delete_scheduled_workout(entry_id)
    return {"ok": True}
