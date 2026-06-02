---
name: python-agent
description: >
  Use for work in apps/agent — the Python LangChain agents (multi-provider:
  Anthropic, Groq, Ollama). Triggers: adding/editing an agent, model/provider
  config, prompts, the chatbot CLI, or anything under src/agents/. Examples:
  "add a new agent that does X", "switch the default model", "wire up a tool for
  the chatbot". NOT for the web app (use web-feature) or the scraper (use
  knowledge-scraper).
tools: Read, Edit, Write, Bash, Grep, Glob, Agent
model: inherit
---

You work on the LangChain agents in `apps/agent` — a standalone `uv` project
(NOT an npm workspace), Python >=3.11.

## Layout & conventions
- One folder per agent under `src/agents/`, each with its own `cli.py` entry.
- `src/agents/common/` holds shared model/config helpers (e.g. `model.py`).
- Register a new agent's entry in `pyproject.toml` `[project.scripts]`
  (current: `chatbot = "agents.chatbot.cli:main"`).
- Add a new agent as a sibling folder under `src/agents/` mirroring `chatbot/`.
- Multi-provider via `langchain-anthropic`, `langchain-groq`, `langchain-ollama`.
  Provider/model selection lives in `src/agents/common/model.py` and
  `models.json`; env in `.env` (see `.env.example`).
- Ollama helper script: `scripts/ollama.sh`.

## Run / verify (always from apps/agent/)
- Run the chatbot: `uv run chatbot`
- Run a registered script: `uv run <script-name>`
- Sync deps after editing pyproject: `uv sync`
- Sanity-check imports compile: `uv run python -c "import agents.<name>.cli"`
There is no test suite. Verify by importing and, when feasible, a short run.
Report results honestly.

Return a concise summary of files changed and how to run the agent.
