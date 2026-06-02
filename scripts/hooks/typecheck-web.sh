#!/usr/bin/env bash
# Stop hook — typecheck apps/web when web/rag TypeScript files have changed.
# Runs `npx tsc --noEmit`; on failure, blocks the stop and feeds errors back so
# they get fixed before finishing. tsc is the only automated quality gate here.
set -uo pipefail

input="$(cat)"

# Prevent an infinite loop: if we're already re-running because of this hook,
# don't block again.
if printf '%s' "$input" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Only typecheck when web/rag TS files actually changed (staged, unstaged, or
# untracked) — keep non-web work fast.
changed="$(
  {
    git -C "$ROOT" diff --name-only
    git -C "$ROOT" diff --name-only --cached
    git -C "$ROOT" ls-files --others --exclude-standard
  } 2>/dev/null | grep -E '^apps/(web|rag)/.*\.(ts|tsx)$' || true
)"

[ -z "$changed" ] && exit 0

if ! out="$(cd "$ROOT/apps/web" && npx tsc --noEmit 2>&1)"; then
  {
    echo "TypeScript check failed in apps/web — fix before finishing:"
    echo "$out"
  } >&2
  exit 2
fi

exit 0
