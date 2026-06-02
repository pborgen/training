"""FastAPI application — the Python port of apps/web/src/server.ts.

Serves the same /api routes the React client already calls, plus the built
SPA (static assets + index.html fallback). On startup it ensures all tables
exist and seeds the catalog, dev accounts, and dev routines.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles

from . import config, db
from .rag.db import ensure_rag_tables
from .routers import (
    admin,
    auth,
    exercises,
    profile,
    rag,
    readiness,
    routines,
    schedule,
    workout_log,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_pool()
    await db.ensure_tables()
    await ensure_rag_tables()
    await db.seed_exercises()
    await db.seed_dev_users()
    await db.seed_dev_routines()
    print(f"Training API ready (port {config.PORT})")
    yield
    await db.close_pool()


app = FastAPI(title="PFA Training API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Match the Express contract: errors are returned as { "error": "..." }.
@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse({"error": exc.detail}, status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse({"error": "Invalid request"}, status_code=400)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    return JSONResponse({"error": str(exc)}, status_code=500)


# ── API routers ───────────────────────────────────────────

for module in (
    auth,
    profile,
    exercises,
    routines,
    workout_log,
    readiness,
    schedule,
    admin,
    rag,
):
    app.include_router(module.router)


@app.get("/hello", response_class=PlainTextResponse)
async def hello():
    return "hello from training app"


@app.get("/api/health")
async def health():
    return {"ok": True}


# ── Static client + SPA fallback ──────────────────────────

_client_dir = config.CLIENT_DIR
if (_client_dir / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=_client_dir / "assets"), name="assets")


@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    # Serve a real static file if it exists, else fall through to the SPA entry.
    if full_path:
        candidate = (_client_dir / full_path).resolve()
        if _client_dir in candidate.parents and candidate.is_file():
            return FileResponse(candidate)
    index = _client_dir / "index.html"
    if index.is_file():
        return FileResponse(index)
    return JSONResponse({"error": "Not found"}, status_code=404)


def run() -> None:
    """Entry point for `uv run api` / the `api` script."""
    import uvicorn

    uvicorn.run("api.main:app", host="0.0.0.0", port=config.PORT, reload=False)


if __name__ == "__main__":
    run()
