# PFA Training App

Fitness coaching platform — admin manages clients, schedules workouts, and tracks progress. Clients log workouts, check readiness, and chat with an AI exercise coach.

## Project Structure

Monorepo with npm workspaces:

- `apps/web` — Full-stack app (Express API + React SPA)
- `apps/rag` — RAG exercise coach library (knowledge base, retrieval, generation, DB)
- `apps/agent` — Python agents built on LangChain (standalone `uv` project, not an npm workspace). One folder per agent under `src/agents/`; `src/agents/common/` holds shared model/config helpers. Add new agents as sibling folders with their own `cli.py` entry and register in `pyproject.toml` `[project.scripts]`. Run with `uv run chatbot` from `apps/agent/`.

## Tech Stack

- **Frontend:** React 19, TanStack Router (file-based), TanStack React Query, Vite 8, CSS (no component library)
- **Backend:** Express 4, TypeScript, `postgres` npm package (raw SQL, no ORM)
- **Database:** PostgreSQL — tables auto-created on startup via `ensureTables()` in `db.ts`
- **Auth:** Google OAuth + username/password, roles: `admin` | `client`
- **AI:** Anthropic SDK for RAG-based exercise coach

## Commands

```bash
# From repo root:
npm run web:dev        # Start dev server + vite client (port 8080 + vite proxy)
npm run web:build      # Build for production

# From apps/web:
npm run dev            # Same as above
npm run dev:server     # Server only (tsx watch)
npm run dev:client     # Client only (vite)
npm run build          # tsc + vite build → dist/
```

TypeScript check: `npx tsc --noEmit` (from `apps/web`)

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

## Architecture Conventions

### Database (`apps/web/src/db.ts`)

- All schema in `ensureTables()` — tables created if not exist, migrations via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Raw SQL queries — no ORM. Helper functions like `getProfile()`, `upsertProfile()`, etc.
- UUIDs via `crypto.randomUUID()`
- JSONB columns for nested arrays (exercises in routines, media on exercises)
- snake_case column names, camelCase in TypeScript
- Seed functions (`seedExercises`, `seedDevAccounts`, `seedDevRoutines`) only insert when table is empty

### Server (`apps/web/src/server.ts`)

- All API routes in a single file
- Auth middleware reads `x-user-email` header (dev) or `Authorization: Bearer` token (prod)
- Admin routes under `/api/admin/*` — check `role === "admin"` and return 403 if not
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

1. Add table/columns in `ensureTables()` and DB helper functions in `db.ts`
2. Add Express routes in `server.ts` (with auth/role checks)
3. Add TypeScript types in `client/types.ts`
4. Add API client functions in `client/api.ts`
5. Add React Query hook in `client/hooks/`
6. Add route component in `client/routes/_authenticated/`
7. Register route in `client/router.tsx`
8. Add nav item in `client/routes/__root.tsx` (with `adminOnly`/`clientOnly` flags if needed)
9. Add CSS in `client/styles.css`

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
