# syntax=docker/dockerfile:1
#
# Python FastAPI backend (apps/api) that also serves the built React client.
# Build context must be the repo root:
#   docker build -f apps/api/Dockerfile -t training-api .

# ── Stage 1: build the React client ──────────────────────
FROM node:22-bookworm-slim AS client
WORKDIR /app

# Workspace manifests first for layer caching.
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/web apps/web
RUN npm --workspace apps/web run build   # → apps/web/dist/client

# ── Stage 2: Python API runtime ──────────────────────────
FROM python:3.12-slim AS runner
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PORT=8080

WORKDIR /app/apps/api

# The API depends on the agents package (apps/agent) via a uv path source
# (agents = { path = "../agent" }), so its source must be present before
# `uv sync` can resolve and install it. Includes models.json, which
# common/model.py reads at runtime.
COPY apps/agent /app/apps/agent

# Install deps first (cached unless pyproject/lock change).
COPY apps/api/pyproject.toml apps/api/uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# App source.
COPY apps/api/ ./
RUN uv sync --frozen --no-dev

# Built client from stage 1 — CLIENT_DIR defaults to ../web/dist/client.
COPY --from=client /app/apps/web/dist/client /app/apps/web/dist/client

EXPOSE 8080
# Run from the venv built above. --no-sync prevents uv from re-resolving/building
# at startup (which would hit PyPI — impossible behind the VPC connector with no
# NAT, and unnecessary since the image is already fully built).
CMD ["uv", "run", "--frozen", "--no-sync", "--no-dev", "api"]
