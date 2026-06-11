"""The four specialist agents that make up the coaching team.

Each specialist is a self-contained ReAct agent (langgraph.prebuilt) with its own
system prompt and a narrow tool set. The supervisor never touches tools directly —
it routes a turn to the specialist whose `description` best fits, runs it, and reads
back its answer. Keeping the specialists as separate graphs means each one's tool
loop stays small and focused.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from langgraph.graph.state import CompiledStateGraph
from langgraph.prebuilt import create_react_agent

from agents.common.model import build_chat_model
from agents.team import tools

_TODAY = "Today's date is {today}.".format(today=date.today().isoformat())

PLANNING_PROMPT = f"""You are the workout-planning specialist on a fitness coaching \
team. {_TODAY}
You design and adjust training: building/critiquing routines and scheduling workouts.
Use your tools to read the exercise catalog, the client's routines, and their schedule \
before advising — never invent routine ids or exercises. To schedule, find the routine \
id with list_routines first. Be concrete: name exercises, sets, reps, and days."""

NUTRITION_PROMPT = f"""You are the nutrition specialist on a fitness coaching team. \
{_TODAY}
You advise on diet, macros, protein targets, meal timing, and hydration. Always pull \
the client's profile first so advice fits their real weight, goal, and activity level. \
The app has no food database, so give practical guidance and concrete numbers (e.g. \
protein grams/day) rather than logging meals. Flag anything that needs a doctor or RD."""

RECOVERY_PROMPT = f"""You are the recovery & readiness specialist on a fitness coaching \
team. {_TODAY}
You read the client's readiness check-ins (sleep, soreness, energy, stress) and advise \
on rest, deloads, mobility, and whether to train hard or back off today. Always look at \
recent check-ins before answering. Be direct about when to rest."""

PROGRESS_PROMPT = f"""You are the progress-analysis specialist on a fitness coaching \
team. {_TODAY}
You analyze the client's logged workouts to surface trends: volume, progression on key \
lifts, consistency, and plateaus. Pull the workout log (and routines for context) before \
answering, cite real numbers and dates, and call out concrete next steps."""


@dataclass(frozen=True)
class Specialist:
    name: str  # routing key, used by the supervisor
    title: str  # human label for the CLI
    description: str  # tells the supervisor when to route here
    graph: CompiledStateGraph


def build_specialists() -> dict[str, Specialist]:
    """Construct all specialists keyed by routing name. Each gets its own model
    instance (low temperature — these are grounded, tool-driven roles)."""

    def react(prompt: str, tool_set: list) -> CompiledStateGraph:
        model = build_chat_model(temperature=0.2, max_tokens=2048)
        return create_react_agent(model, tool_set, prompt=prompt)

    specs = [
        Specialist(
            "planning",
            "Workout planning",
            "Designing or adjusting routines, choosing exercises, and scheduling workouts.",
            react(PLANNING_PROMPT, tools.PLANNING_TOOLS),
        ),
        Specialist(
            "nutrition",
            "Nutrition",
            "Diet, macros, protein targets, meal timing, hydration, and weight goals.",
            react(NUTRITION_PROMPT, tools.NUTRITION_TOOLS),
        ),
        Specialist(
            "recovery",
            "Recovery & readiness",
            "Rest, deloads, soreness, sleep, fatigue, and whether to train hard today.",
            react(RECOVERY_PROMPT, tools.RECOVERY_TOOLS),
        ),
        Specialist(
            "progress",
            "Progress analysis",
            "Analyzing logged workouts for trends, progression, plateaus, and consistency.",
            react(PROGRESS_PROMPT, tools.PROGRESS_TOOLS),
        ),
    ]
    return {s.name: s for s in specs}
