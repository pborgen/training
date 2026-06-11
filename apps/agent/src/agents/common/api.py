"""Shared HTTP client for agent tools that talk to the PFA FastAPI backend.

Tools hit the API on PFA_API_URL (default http://localhost:8080) using dev auth
headers (x-user-email), so the API must run with ALLOW_DEV_AUTH_HEADERS=true.
Responses are slimmed before being returned to the model: media is stored as
base64 data URLs in JSONB and would blow up the context window.
"""
from __future__ import annotations

import json
import os
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any

import httpx

API_URL = os.getenv("PFA_API_URL", "http://localhost:8080")
USER_EMAIL = os.getenv("PFA_USER_EMAIL", "paul@dev.local")

# The email the tools act as. Defaults to the env user for CLI use; the API sets
# this per request (via acting_user) so the team acts as the authenticated client.
_acting_user: ContextVar[str] = ContextVar("acting_user", default=USER_EMAIL)

_MAX_STRING = 500  # anything longer is almost certainly a data URL


@contextmanager
def acting_user(email: str):
    """Run the enclosed tool calls as `email`. Used by the API to scope the team
    to the authenticated client; the CLI just relies on the env default."""
    token = _acting_user.set(email)
    try:
        yield
    finally:
        _acting_user.reset(token)


def slim(value: Any) -> Any:
    """Recursively drop media blobs and truncate huge strings."""
    if isinstance(value, dict):
        return {k: slim(v) for k, v in value.items() if k not in {"media", "photo", "image"}}
    if isinstance(value, list):
        return [slim(v) for v in value]
    if isinstance(value, str) and len(value) > _MAX_STRING:
        return value[:_MAX_STRING] + "…(truncated)"
    return value


def request(
    method: str,
    path: str,
    body: dict | None = None,
    params: dict | None = None,
) -> str:
    """Make one request to the backend and return a JSON string (slimmed) or an
    error string. Tools return strings so the model always gets a readable result."""
    response = httpx.request(
        method,
        f"{API_URL}{path}",
        json=body,
        params=params,
        headers={"x-user-email": _acting_user.get()},
        timeout=15,
    )
    try:
        data = response.json()
    except ValueError:
        return f"API error ({response.status_code}): {response.text[:300]}"
    if response.status_code >= 400:
        return f"API error ({response.status_code}): {json.dumps(data)}"
    return json.dumps(slim(data))
