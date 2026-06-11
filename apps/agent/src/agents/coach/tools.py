"""Tools for the coach agent — thin wrappers over the PFA FastAPI backend.

Each tool hits the API on PFA_API_URL (default http://localhost:8080) using
dev auth headers (x-user-email), so the API must run with
ALLOW_DEV_AUTH_HEADERS=true. Responses are slimmed before being returned to
the model: media is stored as base64 data URLs in JSONB and would blow up the
context window.
"""
from __future__ import annotations

import json
import os
from typing import Any

import httpx
from langchain_core.tools import tool

API_URL = os.getenv("PFA_API_URL", "http://localhost:8080")
USER_EMAIL = os.getenv("PFA_USER_EMAIL", "paul@dev.local")

_MAX_STRING = 500  # anything longer is almost certainly a data URL


def _slim(value: Any) -> Any:
    """Recursively drop media blobs and truncate huge strings."""
    if isinstance(value, dict):
        return {k: _slim(v) for k, v in value.items() if k not in {"media", "photo", "image"}}
    if isinstance(value, list):
        return [_slim(v) for v in value]
    if isinstance(value, str) and len(value) > _MAX_STRING:
        return value[:_MAX_STRING] + "…(truncated)"
    return value


def _request(method: str, path: str, body: dict | None = None, params: dict | None = None) -> str:
    response = httpx.request(
        method,
        f"{API_URL}{path}",
        json=body,
        params=params,
        headers={"x-user-email": USER_EMAIL},
        timeout=15,
    )
    try:
        data = response.json()
    except ValueError:
        return f"API error ({response.status_code}): {response.text[:300]}"
    if response.status_code >= 400:
        return f"API error ({response.status_code}): {json.dumps(data)}"
    return json.dumps(_slim(data))


@tool
def list_catalog_exercises() -> str:
    """List all exercises in the PFA exercise catalog (name, muscle groups, equipment, etc.)."""
    return _request("GET", "/api/exercises")


@tool
def list_routines() -> str:
    """List the user's workout routines, including each routine's id, name, and exercises."""
    return _request("GET", "/api/routines")


@tool
def get_routine(routine_id: str) -> str:
    """Get full details of one routine by its id, including sets/reps for each exercise."""
    return _request("GET", f"/api/routines/{routine_id}")


@tool
def get_schedule(from_date: str, to_date: str) -> str:
    """Get the user's scheduled workouts between two dates (inclusive, YYYY-MM-DD)."""
    return _request("GET", "/api/my-schedule", params={"from": from_date, "to": to_date})


@tool
def schedule_workout(routine_id: str, routine_name: str, scheduled_date: str, notes: str = "") -> str:
    """Schedule a workout for the user. Requires a routine id and name (look them up with
    list_routines first) and a date in YYYY-MM-DD format. Optional notes."""
    body = {"routineId": routine_id, "routineName": routine_name, "scheduledDate": scheduled_date}
    if notes:
        body["notes"] = notes
    return _request("POST", "/api/my-schedule", body=body)


@tool
def get_readiness_checkins(limit: int = 7) -> str:
    """Get the user's most recent readiness check-ins (sleep, soreness, energy, etc.)."""
    return _request("GET", "/api/readiness", params={"limit": limit})


COACH_TOOLS = [
    list_catalog_exercises,
    list_routines,
    get_routine,
    get_schedule,
    schedule_workout,
    get_readiness_checkins,
]
