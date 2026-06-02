"""Environment-driven configuration, loaded once at import time."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Repo paths: this file is apps/api/src/api/config.py
_APP_ROOT = Path(__file__).resolve().parents[2]  # apps/api
_REPO_ROOT = _APP_ROOT.parents[1]  # repo root

POSTGRES_URL: str | None = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL")
PORT: int = int(os.getenv("PORT", "8080"))
GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
ALLOW_DEV_AUTH_HEADERS: bool = os.getenv("ALLOW_DEV_AUTH_HEADERS") == "true"
AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")

# Bedrock model id for the RAG exercise coach. Defaults to Claude 3.5 Haiku —
# the cheapest Claude — override with RAG_MODEL_ID for a more capable model.
RAG_MODEL_ID: str = os.getenv(
    "RAG_MODEL_ID", "us.anthropic.claude-3-5-haiku-20241022-v1:0"
)

# Where the built React client lives. The old Express server served
# apps/web/dist/client; default to the same location.
CLIENT_DIR: Path = Path(
    os.getenv("CLIENT_DIR", str(_APP_ROOT.parent / "web" / "dist" / "client"))
)
