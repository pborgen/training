# PFA Training App

Fitness coaching platform — admin manages clients, schedules workouts, and tracks progress. Clients log workouts, check readiness, and chat with an AI exercise coach.

## Project Structure

Monorepo with npm workspaces:

- `apps/api` — **Python FastAPI backend** (standalone `uv` project). The single backend: serves all `/api/*` routes, raw SQL via `asyncpg`, and the built React client. Run with `uv run api` from `apps/api/`. RAG coach lives under `src/api/rag/`. Routers are one file per feature in `src/api/routers/`, registered in `main.py`.
- `apps/web` — React SPA client only (Vite). Talks to the FastAPI backend on `:8080` (Vite proxies `/api` in dev). No server code here.
- `apps/agent` — Python agents built on LangChain (standalone `uv` project, not an npm workspace). One folder per agent under `src/agents/`; `src/agents/common/` holds shared model/config helpers. Add new agents as sibling folders with their own `cli.py` entry and register in `pyproject.toml` `[project.scripts]`. Run with `uv run chatbot` from `apps/agent/`.

## Tech Stack

- **Frontend:** React 19, TanStack Router (file-based), TanStack React Query, Vite 8, CSS (no component library)
- **Backend:** FastAPI (Python, `apps/api`) — async, `asyncpg`, raw SQL, no ORM.
- **Database:** PostgreSQL — tables auto-created on startup (`ensure_tables()` in `apps/api/src/api/db.py`)
- **Auth:** Google OAuth + username/password, roles: `admin` | `client` | `coach`
- **AI:** Claude on AWS Bedrock for the RAG-based exercise coach

## Commands

```bash
# From repo root:
./scripts/dev.sh       # Postgres check + FastAPI on :8080 + Vite client (proxies /api)
npm run api:dev        # FastAPI only (uvicorn --reload, :8080)
npm run client:dev     # Vite client only (proxies /api → :8080)
npm run web:build      # Build the React client for production

# From apps/api:
uv run api             # Start the FastAPI server (serves API + built client)
uv sync                # Install/refresh Python deps
```

TypeScript check (client): `npx tsc --noEmit` (from `apps/web`)

## Environment Variables

Copy `apps/web/.env.example` → `apps/web/.env`:

- `POSTGRES_URL` — PostgreSQL connection string
- `ALLOW_DEV_AUTH_HEADERS=true` — Enables dev auth via `x-user-email` header
- `GOOGLE_CLIENT_ID` — For production Google OAuth
- `ANTHROPIC_API_KEY` — For RAG exercise coach

## Dev Accounts

Seeded automatically when `ALLOW_DEV_AUTH_HEADERS=true`:

- `admin@dev.local` / `admin` (admin role)
- `paul@dev.local` / `paul` (client role)
- `diego@dev.local` / `diego` (client role)
- `coach@dev.local` / `coach` (coach role)

## Architecture Conventions

### Database (`apps/api/src/api/db.py`)

- All schema in `ensure_tables()` — tables created if not exist, migrations via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Raw SQL via `asyncpg` — no ORM. Helper functions like `get_profile()`, `upsert_profile()`, etc.
- A JSONB type codec (`_init_conn`) encodes/decodes JSONB transparently to/from Python objects
- UUIDs via `uuid.uuid4()`
- JSONB columns for nested arrays (exercises in routines, media on exercises)
- snake_case column names; helpers return camelCase dicts for the client
- Seed functions (`seed_exercises`, `seed_dev_users`, `seed_dev_routines`, `seed_coach_spotlights`) only insert when table is empty; called from the lifespan in `main.py`

### Server (`apps/api/src/api/`)

- Routes grouped by feature into routers under `routers/` (one file each), registered in `main.py`'s `include_router` loop
- Auth via FastAPI dependencies in `auth.py`: `require_user` / `require_admin` / `require_coach`. Reads `x-user-email` header (dev) or `Authorization: Bearer` token (prod)
- Admin routes under `/api/admin/*` depend on `require_admin` (403 if not admin); coach routes depend on `require_coach`
- Errors returned as `{ "error": "..." }` via exception handlers in `main.py`
- Feature flags stored in `app_settings` table (key-value)

### Client

- **Routes** in `src/client/routes/` — protected routes under `_authenticated/`
- **API client** in `src/client/api.ts` — thin wrappers around `apiFetch<T>(method, path, body)`
- **Hooks** in `src/client/hooks/` — one file per feature, using React Query
  - `useQuery` for reads, `useMutation` for writes
  - Invalidate or set query data on mutation success
- **Types** in `src/client/types.ts`
- **Styles** in `src/client/styles.css` — dark theme with CSS custom properties, no CSS modules
- **Auth** in `src/client/auth.tsx` — React context, stores token in `localStorage`

### Naming Patterns

- API functions: `fetch*`, `create*`, `update*`, `delete*`, `save*`
- Hooks: `use*` (e.g., `useRoutines`, `useSaveProfile`)
- Route files: TanStack Router conventions (`$param`, `_layout`)

### UI Patterns

- Cards: `<div className="card">`
- Forms: `<div className="form-stack">` with `<label className="form-label">`
- Modals: `.modal-overlay` + `.modal` with `.modal-actions`
- Row items: `.row-card` with `.row-card-flex`
- Toggle groups: `.unit-toggle` with `.active` button
- Accent color: `var(--accent)` (#CBFF2E electric lime)
- No component library — all custom CSS

### Data Storage

- Media (photos/videos) stored as base64 data URLs in JSONB
- Timestamps in TIMESTAMPTZ
- Email is the primary user identifier throughout (profiles PK, foreign keys)

## Adding a New Feature (typical flow)

1. Add table/columns in `ensure_tables()` and DB helper functions in `apps/api/src/api/db.py`
2. Add a router in `apps/api/src/api/routers/` (with auth dependencies) and register it in `main.py`
3. Add TypeScript types in `apps/web/src/client/types.ts`
4. Add API client functions in `apps/web/src/client/api.ts`
5. Add React Query hook in `apps/web/src/client/hooks/`
6. Add route component in `apps/web/src/client/routes/_authenticated/`
7. Register route in `apps/web/src/client/router.tsx`
8. Add nav item in `apps/web/src/client/routes/__root.tsx` (with `adminOnly`/`clientOnly` flags if needed)
9. Add CSS in `apps/web/src/client/styles.css`

<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:

- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
