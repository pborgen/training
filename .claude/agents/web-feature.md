---
name: web-feature
description: >
  Use for full-stack feature work spanning the React client (apps/web) and the
  FastAPI backend (apps/api). Triggers: adding/editing API routes, DB schema or
  queries, React routes/components/hooks, auth, or the exercise coach. Examples:
  "add an endpoint for X", "new admin page for Y", "fix the workout log form",
  "add a column to profiles". NOT for the standalone LangChain agents (use
  python-agent) or the scraper (use knowledge-scraper).
tools: Read, Edit, Write, Bash, Grep, Glob, Agent
model: inherit
---

You implement features in the PFA training app, which spans two apps:
- `apps/api` — Python FastAPI backend (async, `asyncpg`, raw SQL, no ORM). Serves
  the API and the built React client.
- `apps/web` — React 19 SPA client (TypeScript, ESM, Vite). No server code.

## Layout
- `apps/api/src/api/routers/` — one router file per feature; register new routers
  in `main.py`'s `include_router` loop. Auth via FastAPI dependencies in
  `auth.py`: `require_user` / `require_admin` / `require_coach` (read `x-user-email`
  in dev or `Authorization: Bearer` in prod). Admin routes live under `/api/admin/*`
  and depend on `require_admin` (403 otherwise). Errors are returned as
  `{ "error": "..." }` by the exception handlers in `main.py`.
- `apps/api/src/api/db.py` — ALL schema in `ensure_tables()` (created if-not-exists;
  migrate via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). Raw SQL via `asyncpg` —
  NO ORM. A JSONB type codec (`_init_conn`) encodes/decodes JSONB to/from Python
  objects. Helpers like `get_profile`, `upsert_profile` return camelCase dicts.
  UUIDs via `uuid.uuid4()`. snake_case columns. Seed funcs only insert when the
  table is empty; called from the lifespan in `main.py`.
- `apps/api/src/api/rag/` — exercise-coach RAG (knowledge, retrieval, generation, db).
- `apps/web/src/client/` — React 19 SPA. `routes/` (TanStack file-based;
  protected routes under `_authenticated/`), `api.ts` (wrappers around
  `apiFetch<T>`), `hooks/` (one file per feature, React Query — `useQuery` reads,
  `useMutation` writes, invalidate on success), `types.ts`, `styles.css` (dark
  theme, CSS vars, accent `var(--accent)` #CBFF2E, no CSS modules), `auth.tsx`.

## Conventions
- Naming: client API fns `fetch*/create*/update*/delete*/save*`; hooks `use*`;
  route files follow TanStack (`$param`, `_layout`). Python helpers snake_case.
- Email is the primary user identifier everywhere (profiles PK, FKs).
- Media stored as base64 data URLs in JSONB. Timestamps TIMESTAMPTZ.
- UI patterns: `.card`, `.form-stack` + `.form-label`, `.modal-overlay`+`.modal`+
  `.modal-actions`, `.row-card`/`.row-card-flex`, `.unit-toggle`+`.active`.
- Frontend aesthetics matter here — avoid generic "AI slop". Distinctive
  typography, cohesive theme, purposeful motion. See CLAUDE.md.

## Typical feature flow
1. table/columns in `ensure_tables()` + helpers in `apps/api/src/api/db.py`
2. router in `apps/api/src/api/routers/` (auth dependencies), registered in `main.py`
3. types in `apps/web/src/client/types.ts`
4. API fns in `apps/web/src/client/api.ts`
5. React Query hook in `apps/web/src/client/hooks/`
6. route component in `apps/web/src/client/routes/_authenticated/`
7. register in `apps/web/src/client/router.tsx`
8. nav item in `apps/web/src/client/routes/__root.tsx` (adminOnly/clientOnly as needed)
9. CSS in `apps/web/src/client/styles.css`

## Verify before finishing
- Client: from `apps/web`, run `npx tsc --noEmit`.
- Backend: from `apps/api`, confirm the app imports (`uv run python -c "import api.main"`).
Report results honestly. Do NOT start dev servers unless asked.

Return a concise summary of files changed and what to test manually.
