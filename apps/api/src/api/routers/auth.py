"""Auth + session endpoints."""
from __future__ import annotations

import asyncio
import hashlib

from fastapi import APIRouter, Body, Request
from fastapi.responses import JSONResponse

from .. import config, db
from ..auth import identify_user

router = APIRouter()

DEV_ACCOUNTS = [
    {"email": "admin@dev.local", "name": "Admin", "role": "admin"},
    {"email": "paul@dev.local", "name": "Paul", "role": "client"},
    {"email": "diego@dev.local", "name": "Diego", "role": "client"},
]


@router.get("/api/dev/accounts")
async def dev_accounts():
    if not config.ALLOW_DEV_AUTH_HEADERS:
        return JSONResponse({"error": "Not found"}, status_code=404)
    return DEV_ACCOUNTS


@router.post("/api/login")
async def login(body: dict = Body(default={})):
    username = body.get("username")
    password = body.get("password")
    if not username or not password:
        return JSONResponse({"error": "Username and password required"}, status_code=400)
    user = await db.get_user_by_username(username)
    if not user:
        return JSONResponse({"error": "Invalid username or password"}, status_code=401)
    digest = hashlib.sha256(password.encode()).hexdigest()
    if digest != user["passwordHash"]:
        return JSONResponse({"error": "Invalid username or password"}, status_code=401)
    return {"ok": True, "email": user["email"], "role": user["role"], "username": user["username"]}


@router.post("/api/auth/google")
async def auth_google(body: dict = Body(default={})):
    credential = body.get("credential")
    if not credential:
        return JSONResponse({"error": "Missing credential"}, status_code=400)
    if not config.GOOGLE_CLIENT_ID:
        return JSONResponse({"error": "Google auth not configured"}, status_code=500)
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token

        payload = await asyncio.to_thread(
            google_id_token.verify_oauth2_token,
            credential,
            google_requests.Request(),
            config.GOOGLE_CLIENT_ID,
        )
        email = payload.get("email")
        if not email:
            return JSONResponse({"error": "No email in token"}, status_code=401)
        await db.ensure_google_user(email, payload.get("name"))
        role = await db.get_user_role(email)
        return {"ok": True, "email": email, "role": role}
    except Exception:
        return JSONResponse({"error": "Invalid Google token"}, status_code=401)


@router.get("/api/auth/config")
async def auth_config():
    return {"googleClientId": config.GOOGLE_CLIENT_ID or None}


@router.get("/api/session")
async def session(request: Request):
    try:
        email = await identify_user(request)
    except Exception:
        email = None
    if not email:
        return JSONResponse({"ok": False, "authenticated": False}, status_code=401)
    return {"ok": True, "authenticated": True, "email": email}
