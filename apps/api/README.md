# apps/api — Python backend (FastAPI)

The Python port of the old Express server (`apps/web/src/server.ts` + `db.ts`).
It exposes the exact same `/api/*` routes the React client already calls, so the
SPA in `apps/web` needs no changes — it just points at this server instead.

## Stack

- **FastAPI** + **Uvicorn** — async HTTP
- **asyncpg** — raw SQL against Postgres (no ORM, mirrors the old `postgres` usage)
- **google-auth** — Google OAuth ID-token verification
- **anthropic[bedrock]** — Claude on AWS Bedrock for the RAG exercise coach

## Layout

```
src/api/
  config.py        env-driven config
  db.py            connection pool + all DB helpers + schema/seed
  auth.py          require_user / require_admin FastAPI dependencies
  main.py          app wiring, startup (ensure tables + seed), static SPA serving
  routers/         one module per endpoint group
  rag/             knowledge base: db, retrieval, generation (Bedrock), embeddings
    data/knowledge.json   66 exercise knowledge chunks (exported from apps/rag)
```

## Run

```bash
cd apps/api
cp .env.example .env          # set POSTGRES_URL etc.
uv sync
uv run api                    # serves http://localhost:8080
```

On startup it ensures all tables exist and seeds the catalog exercises, dev
accounts, and dev routines (same as the old server).

### Dev auth

With `ALLOW_DEV_AUTH_HEADERS=true`, send `x-user-email: admin@dev.local` (admin)
or `paul@dev.local` / `diego@dev.local` (client) instead of a Google token.

### Serving the client

In production this server also serves the built React client. Build it first:

```bash
npm --workspace apps/web run build   # → apps/web/dist/client
```

`main.py` serves `apps/web/dist/client` (override with `CLIENT_DIR`). In local
dev you can instead run the Vite dev server (`apps/web`) which proxies `/api` here.

## Deploy

`apps/api/Dockerfile` builds the React client and runs the API in one image
(build context = repo root):

```bash
docker build -f apps/api/Dockerfile -t training-api .
docker run -p 8080:8080 --env-file apps/api/.env training-api
```

The container serves both the API and the SPA on `:8080`. Point it at a managed
Postgres (`POSTGRES_URL`) and provide `GOOGLE_CLIENT_ID` + AWS Bedrock credentials
for production auth and the RAG coach.

> The old `apps/web` Express server still has its own Dockerfile/Vercel config.
> Once this server is verified in production, retire those.

## Parity notes

- Same routes, status codes (400/401/403/404/413/500) and `{ "error": ... }` body shape.
- The RAG coach uses full-text search (`tsvector`/`websearch_to_tsquery`) — `websearch`
  AND-semantics are preserved from the TS version.
- `apps/web` (Express) is kept until this server is confirmed in production, then retired.
