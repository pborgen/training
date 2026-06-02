# syntax=docker/dockerfile:1
#
# Python FastAPI backend (apps/api) that also serves the built React client.
# Build context must be the repo root:
#   docker build -f apps/api/Dockerfile -t training-api .

# ── Stage 1: build the React client ──────────────────────
FROM node:22-bookworm-slim AS client
WORKDIR /app

# Workspace manifests first for layer caching. apps/rag is listed as a
# workspace so the install resolves it, even though the client doesn't import it.
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/rag/package.json apps/rag/package.json
RUN npm ci

COPY apps/web apps/web
RUN npm --workspace apps/web run build:client   # → apps/web/dist/client

# ── Stage 2: Python API runtime ──────────────────────────
FROM python:3.12-slim AS runner
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PORT=8080

WORKDIR /app/apps/api

# Install deps first (cached unless pyproject/lock change).
COPY apps/api/pyproject.toml apps/api/uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# App source.
COPY apps/api/ ./
RUN uv sync --frozen --no-dev

# Built client from stage 1 — CLIENT_DIR defaults to ../web/dist/client.
COPY --from=client /app/apps/web/dist/client /app/apps/web/dist/client

EXPOSE 8080
CMD ["uv", "run", "--no-dev", "api"]
