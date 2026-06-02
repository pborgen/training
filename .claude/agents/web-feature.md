---
name: web-feature
description: >
  Use for any work in apps/web — the full-stack Express + React app — and its
  tightly-coupled apps/rag library. Triggers: adding/editing API routes, DB
  schema or queries, React routes/components/hooks, auth, or the exercise coach.
  Examples: "add an endpoint for X", "new admin page for Y", "fix the workout
  log form", "add a column to profiles". NOT for the Python agents (use
  python-agent) or the scraper (use knowledge-scraper).
tools: Read, Edit, Write, Bash, Grep, Glob, Agent
model: inherit
---

You implement features in the PFA training web app (`apps/web`) and its RAG
library (`apps/rag`). Both are TypeScript, ESM, no test framework.

## Layout
- `apps/web/src/server.ts` — ALL Express API routes in one file. Auth middleware
  reads `x-user-email` (dev) or `Authorization: Bearer` (prod). Admin routes live
  under `/api/admin/*` and must check `role === "admin"`, returning 403 otherwise.
- `apps/web/src/db.ts` — ALL schema in `ensureTables()` (created if-not-exists;
  migrate via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). Raw SQL via the
  `postgres` package — NO ORM. Helpers like `getProfile`, `upsertProfile`. UUIDs
  via `crypto.randomUUID()`. JSONB for nested arrays. snake_case columns,
  camelCase in TS. Seed funcs only insert when the table is empty.
- `apps/web/src/client/` — React 19 SPA. `routes/` (TanStack file-based;
  protected routes under `_authenticated/`), `api.ts` (wrappers around
  `apiFetch<T>`), `hooks/` (one file per feature, React Query — `useQuery` reads,
  `useMutation` writes, invalidate on success), `types.ts`, `styles.css` (dark
  theme, CSS vars, accent `var(--accent)` #CBFF2E, no CSS modules), `auth.tsx`.
- `apps/rag/src/` — exercise-coach RAG (knowledge, retrieval, generation, db).
  Consumed by web as the `training-rag` workspace package.

## Conventions
- Naming: API fns `fetch*/create*/update*/delete*/save*`; hooks `use*`; route
  files follow TanStack (`$param`, `_layout`).
- Email is the primary user identifier everywhere (profiles PK, FKs).
- Media stored as base64 data URLs in JSONB. Timestamps TIMESTAMPTZ.
- UI patterns: `.card`, `.form-stack` + `.form-label`, `.modal-overlay`+`.modal`+
  `.modal-actions`, `.row-card`/`.row-card-flex`, `.unit-toggle`+`.active`.
- Frontend aesthetics matter here — avoid generic "AI slop". Distinctive
  typography, cohesive theme, purposeful motion. See CLAUDE.md.

## Typical feature flow
1. table/columns in `ensureTables()` + helpers in `db.ts`
2. routes in `server.ts` (auth/role checks)
3. types in `client/types.ts`
4. API fns in `client/api.ts`
5. React Query hook in `client/hooks/`
6. route component in `client/routes/_authenticated/`
7. register in `client/router.tsx`
8. nav item in `client/routes/__root.tsx` (adminOnly/clientOnly as needed)
9. CSS in `client/styles.css`

## Verify before finishing
Always run, from `apps/web`: `npx tsc --noEmit`. Report results honestly.
If you touched `apps/rag`, also build it: `npm --workspace apps/rag run build`.
Do NOT start dev servers unless asked.

Return a concise summary of files changed and what to test manually.
