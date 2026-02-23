# Training Web App

TypeScript frontend + backend sync service.

## Run
```bash
cd apps/web
npm install
cp .env.example .env
npm start
```

## Features
- Editable training table
- XLSX import with formula capture
- Basic formula evaluation parity for row formulas (Weight/Volume with SUM + arithmetic)
- Charts
- JSON import/export
- Google sign-in hook
- `/api/sync` per-user storage backend
- `/api/session` auth check endpoint

## Auth hardening
- Bearer Google ID token auth is preferred.
- Dev header auth (`x-user-email`) is controlled by `ALLOW_DEV_AUTH_HEADERS`.
- Set `ALLOW_DEV_AUTH_HEADERS=false` in production.
