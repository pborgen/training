"""Tools for the coaching team's specialist agents.

Each specialist gets only the tools it needs. All tools are thin wrappers over
the PFA FastAPI backend via the shared client in agents.common.api. Read tools
dominate; the only writes are scheduling a workout and logging a readiness
check-in, both clearly named so the supervisor can keep humans in the loop.
"""
from __future__ import annotations

from langchain_core.tools import tool

from agents.common.api import request

# --- Workout planning -------------------------------------------------------


@tool
def list_catalog_exercises() -> str:
    """List all exercises in the PFA exercise catalog (name, muscle groups, equipment)."""
    return request("GET", "/api/exercises")


@tool
def list_routines() -> str:
    """List the client's workout routines, including each routine's id, name, and exercises."""
    return request("GET", "/api/routines")


@tool
def get_routine(routine_id: str) -> str:
    """Get full details of one routine by its id, including sets/reps for each exercise."""
    return request("GET", f"/api/routines/{routine_id}")


@tool
def get_schedule(from_date: str, to_date: str) -> str:
    """Get the client's scheduled workouts between two dates (inclusive, YYYY-MM-DD)."""
    return request("GET", "/api/my-schedule", params={"from": from_date, "to": to_date})


@tool
def schedule_workout(
    routine_id: str, routine_name: str, scheduled_date: str, notes: str = ""
) -> str:
    """Schedule a workout for the client. Requires a routine id and name (look them up
    with list_routines first) and a date in YYYY-MM-DD format. Optional notes."""
    body = {"routineId": routine_id, "routineName": routine_name, "scheduledDate": scheduled_date}
    if notes:
        body["notes"] = notes
    return request("POST", "/api/my-schedule", body=body)


# --- Nutrition --------------------------------------------------------------


@tool
def get_profile() -> str:
    """Get the client's profile: body stats, goals, and preferences. Use this to ground
    nutrition advice in the client's real weight, goal, and activity level."""
    return request("GET", "/api/profile")


# --- Recovery & readiness ---------------------------------------------------


@tool
def get_readiness_checkins(limit: int = 7) -> str:
    """Get the client's most recent readiness check-ins (sleep, soreness, energy, stress)."""
    return request("GET", "/api/readiness", params={"limit": limit})


# --- Progress analysis ------------------------------------------------------


@tool
def get_workout_log(limit: int = 30) -> str:
    """Get the client's recent logged workouts (completed sets, reps, weights, dates).
    Use this to analyze training volume, progression, and trends over time."""
    return request("GET", "/api/workout-log", params={"limit": limit})


PLANNING_TOOLS = [
    list_catalog_exercises,
    list_routines,
    get_routine,
    get_schedule,
    schedule_workout,
]

NUTRITION_TOOLS = [get_profile]

RECOVERY_TOOLS = [get_readiness_checkins, get_profile]

PROGRESS_TOOLS = [get_workout_log, list_routines, get_profile]
