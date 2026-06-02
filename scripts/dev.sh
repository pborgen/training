#!/usr/bin/env bash
# Start everything needed to run the training app locally.
#
# Services started / checked:
#   Postgres        preflight check — must already be running locally
#   Ollama          optional (--with-ollama), runs in Docker via apps/agent/docker
#   API server      apps/api — Python FastAPI on :8080 (uvicorn --reload)
#   Vite client     apps/web — React dev server, proxies /api to the API on :8080
#
# Usage:
#   ./scripts/dev.sh                 # Postgres check + API server + Vite client
#   ./scripts/dev.sh --with-ollama   # also start the Ollama container for the agent
#   ./scripts/dev.sh --no-web        # preflight + services only, don't start app
#   ./scripts/dev.sh -h | --help     # show this help

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$ROOT/apps/web"
API_DIR="$ROOT/apps/api"
AGENT_DIR="$ROOT/apps/agent"
KNOWLEDGE_DIR="$ROOT/apps/knowledge"

WITH_OLLAMA=0
SKIP_WEB=0
for arg in "$@"; do
  case "$arg" in
    --with-ollama) WITH_OLLAMA=1 ;;
    --no-web)      SKIP_WEB=1 ;;
    -h|--help)     sed -n '2,14p' "$0"; exit 0 ;;
    *)             echo "unknown flag: $arg" >&2; exit 1 ;;
  esac
done

log()  { printf '[dev] %s\n' "$*"; }
fail() { printf '[dev] %s\n' "$*" >&2; exit 1; }

# Copy .env.example → .env for each app that has one and is missing .env.
ensure_env() {
  local dir="$1"
  if [ -f "$dir/.env.example" ] && [ ! -f "$dir/.env" ]; then
    log "creating $dir/.env from .env.example — edit it if the defaults don't fit"
    cp "$dir/.env.example" "$dir/.env"
  fi
}
ensure_env "$WEB_DIR"
ensure_env "$API_DIR"
ensure_env "$AGENT_DIR"
ensure_env "$KNOWLEDGE_DIR"

# Read POSTGRES_URL from apps/api/.env (falling back to apps/web/.env).
POSTGRES_URL="$(
  grep -hE '^POSTGRES_URL=' "$API_DIR/.env" "$WEB_DIR/.env" 2>/dev/null \
    | head -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
)"
POSTGRES_URL="${POSTGRES_URL:-postgresql://postgres@localhost:5432/training}"

check_postgres() {
  log "checking Postgres at $POSTGRES_URL"
  if command -v pg_isready >/dev/null 2>&1; then
    pg_isready -d "$POSTGRES_URL" >/dev/null 2>&1 && { log "Postgres is up."; return; }
  elif command -v psql >/dev/null 2>&1; then
    psql "$POSTGRES_URL" -c 'SELECT 1' >/dev/null 2>&1 && { log "Postgres is up."; return; }
  else
    log "warning: neither pg_isready nor psql found — skipping Postgres check."
    return
  fi
  fail "Postgres not reachable at $POSTGRES_URL
Start it first (e.g. Postgres.app, or 'brew services start postgresql@16'), then retry."
}
check_postgres

if [ ! -d "$ROOT/node_modules" ]; then
  log "installing npm dependencies..."
  (cd "$ROOT" && npm install)
fi

if [ "$WITH_OLLAMA" -eq 1 ]; then
  log "starting Ollama container..."
  "$AGENT_DIR/scripts/ollama.sh" up
fi

if [ "$SKIP_WEB" -eq 1 ]; then
  log "preflight complete — skipping app (--no-web)."
  exit 0
fi

if ! command -v uv >/dev/null 2>&1; then
  fail "uv not found — install it (https://docs.astral.sh/uv/) to run the Python API."
fi

log "syncing Python API dependencies..."
(cd "$API_DIR" && uv sync)

# Start the FastAPI server (background) + Vite client (foreground).
# Kill the API when this script exits.
log "starting API server — http://localhost:8080"
(cd "$API_DIR" && exec uv run uvicorn api.main:app --reload --port 8080) &
API_PID=$!
trap 'kill "$API_PID" 2>/dev/null' EXIT INT TERM

log "starting Vite client — proxies /api to :8080"
exec npm --prefix "$ROOT" run client:dev
