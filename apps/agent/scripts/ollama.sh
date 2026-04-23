#!/usr/bin/env bash
# Manage the local Ollama container for the agents project.
#
# On macOS, Docker runs Ollama CPU-only (no Metal GPU access).
# For faster inference, install Ollama natively: https://ollama.com/download
#
# Usage:
#   ./scripts/ollama.sh up [model]   Start container and pull a model (default: llama3.2:3b)
#   ./scripts/ollama.sh down         Stop container (data persists in docker volume)
#   ./scripts/ollama.sh pull MODEL   Pull an additional model
#   ./scripts/ollama.sh run MODEL    Interactive chat with a model in the container
#   ./scripts/ollama.sh list         Show pulled models
#   ./scripts/ollama.sh logs         Tail container logs
#   ./scripts/ollama.sh nuke         Stop container AND delete the volume (removes all models)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker/docker-compose.yml"
DEFAULT_MODEL="llama3.2:3b"

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

wait_ready() {
  echo "waiting for ollama to be ready..."
  for _ in $(seq 1 30); do
    if docker exec agent-ollama ollama list >/dev/null 2>&1; then
      echo "ollama is ready."
      return 0
    fi
    sleep 1
  done
  echo "timed out waiting for ollama." >&2
  return 1
}

cmd="${1:-}"
case "$cmd" in
  up)
    model="${2:-$DEFAULT_MODEL}"
    compose up -d
    wait_ready
    echo "pulling $model..."
    docker exec agent-ollama ollama pull "$model"
    echo
    echo "done. api: http://localhost:11434"
    echo "run the chatbot with:"
    echo "  LLM_PROVIDER=ollama LLM_MODEL=$model uv run chatbot"
    ;;
  down)
    compose down
    ;;
  pull)
    if [ $# -lt 2 ]; then echo "usage: $0 pull MODEL" >&2; exit 1; fi
    docker exec agent-ollama ollama pull "$2"
    ;;
  run)
    if [ $# -lt 2 ]; then echo "usage: $0 run MODEL" >&2; exit 1; fi
    docker exec -it agent-ollama ollama run "$2"
    ;;
  list)
    docker exec agent-ollama ollama list
    ;;
  logs)
    compose logs -f
    ;;
  nuke)
    compose down -v
    echo "container and volume removed."
    ;;
  *)
    echo "usage: $0 {up [model] | down | pull MODEL | run MODEL | list | logs | nuke}" >&2
    exit 1
    ;;
esac
