"""Coach spotlights + coaching requests — Python port of the Express routes.

- Browse the published coach showcase (any authenticated user).
- Coaches edit their own spotlight (plans, gallery, etc.).
- Clients pick a coach / apply to a plan; coaches manage the request inbox.
"""
from __future__ import annotations

import uuid
from urllib.parse import unquote

from fastapi import APIRouter, Body, Depends, HTTPException

from .. import db
from ..auth import require_coach, require_user

router = APIRouter()


# ── Browse ────────────────────────────────────────────────


@router.get("/api/coaches")
async def get_coaches(_: str = Depends(require_user)):
    return await db.list_published_coaches()


@router.get("/api/coaches/{email}")
async def get_coach(email: str, requester: str = Depends(require_user)):
    target = unquote(email)
    spotlight = await db.get_coach_spotlight(target)
    if not spotlight:
        raise HTTPException(status_code=404, detail="Coach not found")
    if not spotlight["published"] and spotlight["email"] != requester:
        raise HTTPException(status_code=404, detail="Coach not found")
    return spotlight


# ── Coach editor ──────────────────────────────────────────


@router.get("/api/coach/spotlight")
async def get_my_spotlight(email: str = Depends(require_coach)):
    spotlight = await db.get_coach_spotlight(email)
    if not spotlight:
        spotlight = await db.upsert_coach_spotlight(email, {})
    return spotlight


@router.put("/api/coach/spotlight")
async def put_my_spotlight(body: dict = Body(default={}), email: str = Depends(require_coach)):
    spotlight = await db.upsert_coach_spotlight(email, body)
    return {"ok": True, "spotlight": spotlight}


# ── Coaching requests ─────────────────────────────────────


@router.post("/api/coaches/{email}/request")
async def request_coach(email: str, body: dict = Body(default={}), client_email: str = Depends(require_user)):
    coach_email = unquote(email)
    if coach_email == client_email:
        raise HTTPException(status_code=400, detail="You can't request yourself")
    spotlight = await db.get_coach_spotlight(coach_email)
    if not spotlight or not spotlight["published"]:
        raise HTTPException(status_code=404, detail="Coach not found")
    request = await db.create_coaching_request(
        str(uuid.uuid4()),
        coach_email,
        client_email,
        body.get("planId") or "",
        body.get("planName") or "",
        body.get("message") or "",
    )
    return {"ok": True, "request": request}


@router.get("/api/my-requests")
async def get_my_requests(email: str = Depends(require_user)):
    return await db.list_requests_for_client(email)


@router.get("/api/coach/requests")
async def get_coach_requests(email: str = Depends(require_coach)):
    return await db.list_requests_for_coach(email)


@router.put("/api/coach/requests/{id}")
async def update_coach_request(id: str, body: dict = Body(default={}), email: str = Depends(require_coach)):
    status = body.get("status")
    if status not in ("pending", "accepted", "declined"):
        raise HTTPException(status_code=400, detail="Invalid status")
    request = await db.update_coaching_request_status(id, email, status)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"ok": True, "request": request}
