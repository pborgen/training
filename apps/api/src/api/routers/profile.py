"""User profile endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Body, Depends
from fastapi.responses import JSONResponse

from .. import db
from ..auth import require_user

router = APIRouter()


@router.get("/api/profile")
async def get_profile(email: str = Depends(require_user)):
    return await db.get_profile(email)


@router.put("/api/profile")
async def put_profile(body: dict = Body(default={}), email: str = Depends(require_user)):
    await db.upsert_profile(email, body)
    return {"ok": True, "profile": await db.get_profile(email)}


@router.put("/api/profile/photo")
async def put_profile_photo(body: dict = Body(default={}), email: str = Depends(require_user)):
    photo_url = body.get("photoUrl")
    if not photo_url or not isinstance(photo_url, str):
        return JSONResponse({"error": "photoUrl is required"}, status_code=400)
    if not photo_url.startswith("data:image/"):
        return JSONResponse({"error": "Only data URL images are accepted"}, status_code=400)
    if len(photo_url) > 2_800_000:
        return JSONResponse({"error": "Image too large (max ~2MB)"}, status_code=413)
    await db.update_profile_photo(email, photo_url)
    return {"ok": True, "photoUrl": photo_url}
