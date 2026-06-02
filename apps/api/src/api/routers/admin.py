"""Admin endpoints — stats, users, labels, scheduling, settings, knowledge."""
from __future__ import annotations

import asyncio
import uuid
from urllib.parse import unquote

from fastapi import APIRouter, Body, Depends, Query
from fastapi.responses import JSONResponse

from .. import db
from ..auth import require_admin
from ..rag import db as rag_db

router = APIRouter()


# ── Dashboard ─────────────────────────────────────────────


@router.get("/api/admin/stats")
async def admin_stats(_: str = Depends(require_admin)):
    stats, clients, recent = await asyncio.gather(
        db.get_admin_stats(),
        db.get_client_summaries(),
        db.get_recent_workouts_all(10),
    )
    return {"stats": stats, "clients": clients, "recentWorkouts": recent}


@router.get("/api/admin/users")
async def admin_users(_: str = Depends(require_admin)):
    return await db.get_all_users()


# ── Labels ────────────────────────────────────────────────


@router.get("/api/admin/labels")
async def list_labels(_: str = Depends(require_admin)):
    return await db.get_all_labels()


@router.post("/api/admin/labels")
async def create_label(body: dict = Body(default={}), _: str = Depends(require_admin)):
    name = (body.get("name") or "").strip()
    if not name:
        return JSONResponse({"error": "Name required"}, status_code=400)
    label = await db.create_label(str(uuid.uuid4()), name, body.get("color") or "#00c896")
    return {"ok": True, "label": label}


@router.put("/api/admin/labels/{label_id}")
async def update_label(label_id: str, body: dict = Body(default={}), _: str = Depends(require_admin)):
    name = (body.get("name") or "").strip()
    if not name:
        return JSONResponse({"error": "Name required"}, status_code=400)
    label = await db.update_label(label_id, name, body.get("color") or "#00c896")
    if not label:
        return JSONResponse({"error": "Label not found"}, status_code=404)
    return {"ok": True, "label": label}


@router.delete("/api/admin/labels/{label_id}")
async def delete_label(label_id: str, _: str = Depends(require_admin)):
    await db.delete_label(label_id)
    return {"ok": True}


@router.get("/api/admin/user-labels")
async def user_labels(_: str = Depends(require_admin)):
    return await db.get_labels_for_all_users()


@router.put("/api/admin/users/{email}/labels")
async def set_user_labels(email: str, body: dict = Body(default={}), _: str = Depends(require_admin)):
    label_ids = body.get("labelIds")
    if not isinstance(label_ids, list):
        return JSONResponse({"error": "labelIds array required"}, status_code=400)
    await db.set_user_labels(unquote(email), label_ids)
    return {"ok": True}


# ── Scheduled workouts (admin) ────────────────────────────


@router.get("/api/admin/scheduled-workouts")
async def admin_scheduled_workouts(
    frm: str = Query("2000-01-01", alias="from"),
    to: str = Query("2099-12-31"),
    _: str = Depends(require_admin),
):
    return await db.get_scheduled_workouts_for_all(frm, to)


@router.post("/api/admin/scheduled-workouts")
async def admin_create_scheduled_workout(body: dict = Body(default={}), admin_email: str = Depends(require_admin)):
    client_email = body.get("clientEmail")
    routine_id = body.get("routineId")
    routine_name = body.get("routineName")
    scheduled_date = body.get("scheduledDate")
    if not client_email or not routine_id or not routine_name or not scheduled_date:
        return JSONResponse(
            {"error": "clientEmail, routineId, routineName, and scheduledDate are required"},
            status_code=400,
        )
    entry = await db.create_scheduled_workout(
        str(uuid.uuid4()),
        {
            "clientEmail": client_email,
            "routineId": routine_id,
            "routineName": routine_name,
            "scheduledDate": scheduled_date,
            "notes": body.get("notes"),
            "createdBy": admin_email,
        },
    )
    return {"ok": True, "entry": entry}


@router.delete("/api/admin/scheduled-workouts/{entry_id}")
async def admin_delete_scheduled_workout(entry_id: str, _: str = Depends(require_admin)):
    await db.delete_scheduled_workout(entry_id)
    return {"ok": True}


@router.get("/api/admin/routines")
async def admin_routines(_: str = Depends(require_admin)):
    return await db.get_all_routines_admin()


# ── App settings (admin) ──────────────────────────────────


@router.get("/api/admin/settings/{key}")
async def get_setting(key: str, _: str = Depends(require_admin)):
    value = await db.get_setting(key)
    return {"key": key, "value": value}


@router.put("/api/admin/settings/{key}")
async def put_setting(key: str, body: dict = Body(default={}), _: str = Depends(require_admin)):
    value = body.get("value")
    if value is None:
        return JSONResponse({"error": "value required"}, status_code=400)
    await db.set_setting(key, str(value))
    return {"ok": True}


# ── Knowledge management (admin) ──────────────────────────


@router.get("/api/admin/knowledge")
async def list_knowledge(_: str = Depends(require_admin)):
    return await rag_db.get_all_knowledge_chunks()


@router.get("/api/admin/knowledge/{chunk_id}")
async def get_knowledge(chunk_id: str, _: str = Depends(require_admin)):
    chunk = await rag_db.get_knowledge_chunk(chunk_id)
    if not chunk:
        return JSONResponse({"error": "Not found"}, status_code=404)
    return chunk


@router.post("/api/admin/knowledge")
async def create_knowledge(body: dict = Body(default={}), _: str = Depends(require_admin)):
    exercise_id = body.get("exerciseId")
    chunk_type = body.get("chunkType")
    title = body.get("title")
    content = body.get("content")
    if not exercise_id or not chunk_type or not title or not content:
        return JSONResponse({"error": "Missing fields"}, status_code=400)
    chunk_id = f"{exercise_id}-{chunk_type}"
    await rag_db.insert_knowledge_chunk(chunk_id, exercise_id, chunk_type, title, content)
    return {"ok": True, "id": chunk_id}


@router.put("/api/admin/knowledge/{chunk_id}")
async def update_knowledge(chunk_id: str, body: dict = Body(default={}), _: str = Depends(require_admin)):
    title = body.get("title")
    content = body.get("content")
    if not title or not content:
        return JSONResponse({"error": "Missing fields"}, status_code=400)
    await rag_db.update_knowledge_chunk(chunk_id, title, content)
    return {"ok": True}


@router.delete("/api/admin/knowledge/{chunk_id}")
async def delete_knowledge(chunk_id: str, _: str = Depends(require_admin)):
    await rag_db.delete_knowledge_chunk(chunk_id)
    return {"ok": True}
