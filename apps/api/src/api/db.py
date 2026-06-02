"""PostgreSQL access layer — async pool + helpers.

Mirrors apps/web/src/db.ts: same tables, same SQL, same camelCase shapes
returned to the client. Uses asyncpg with positional ($1) parameters.
"""
from __future__ import annotations

import datetime as _dt
import hashlib
import json
from typing import Any

import asyncpg

from . import config

_pool: asyncpg.Pool | None = None


async def _init_conn(conn: asyncpg.Connection) -> None:
    # Decode/encode JSONB transparently to/from Python objects.
    await conn.set_type_codec(
        "jsonb",
        encoder=json.dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )


async def init_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        if not config.POSTGRES_URL:
            raise RuntimeError("POSTGRES_URL is not set")
        _pool = await asyncpg.create_pool(config.POSTGRES_URL, init=_init_conn)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("DB pool not initialized; call init_pool() first")
    return _pool


async def _fetch(query: str, *args: Any) -> list[asyncpg.Record]:
    return await pool().fetch(query, *args)


async def _fetchrow(query: str, *args: Any) -> asyncpg.Record | None:
    return await pool().fetchrow(query, *args)


async def _execute(query: str, *args: Any) -> str:
    return await pool().execute(query, *args)


def _now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).isoformat()


def _dt_now() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc)


def _to_dt(val) -> _dt.datetime | None:
    """Coerce a client-supplied value into an aware datetime for a TIMESTAMPTZ column."""
    if val is None or val == "":
        return None
    if isinstance(val, _dt.datetime):
        return val
    return _dt.datetime.fromisoformat(str(val).replace("Z", "+00:00"))


def _to_date(val) -> _dt.date | None:
    """Coerce a client-supplied value into a date for a DATE column."""
    if val is None or val == "":
        return None
    if isinstance(val, _dt.date) and not isinstance(val, _dt.datetime):
        return val
    if isinstance(val, _dt.datetime):
        return val.date()
    return _dt.date.fromisoformat(str(val)[:10])


# ── Schema ────────────────────────────────────────────────


async def ensure_tables() -> None:
    await _execute(
        """
        CREATE TABLE IF NOT EXISTS profiles (
          email TEXT PRIMARY KEY,
          full_name TEXT DEFAULT '',
          age INT DEFAULT 0,
          gender TEXT DEFAULT '',
          height_cm REAL DEFAULT 0,
          weight_kg REAL DEFAULT 0,
          activity_level TEXT DEFAULT 'moderate',
          units TEXT DEFAULT 'lbs',
          photo_url TEXT DEFAULT '',
          synced_at TIMESTAMPTZ DEFAULT now()
        )
        """
    )
    try:
        await _execute(
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT ''"
        )
    except Exception:
        pass

    await _execute(
        """
        CREATE TABLE IF NOT EXISTS exercises (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          muscle_group TEXT NOT NULL,
          category TEXT NOT NULL,
          default_weight REAL DEFAULT 0,
          default_sets INT DEFAULT 3,
          default_reps INT DEFAULT 10
        )
        """
    )
    await _execute(
        """
        CREATE TABLE IF NOT EXISTS user_exercises (
          id TEXT NOT NULL,
          email TEXT NOT NULL REFERENCES profiles(email),
          name TEXT NOT NULL,
          type TEXT DEFAULT 'strength',
          muscle_group TEXT DEFAULT '',
          default_sets INT DEFAULT 3,
          default_reps INT DEFAULT 10,
          default_weight_kg REAL DEFAULT 0,
          media JSONB DEFAULT '[]',
          created_at TIMESTAMPTZ DEFAULT now(),
          PRIMARY KEY (email, id)
        )
        """
    )
    try:
        await _execute(
            "ALTER TABLE user_exercises ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'"
        )
    except Exception:
        pass
    await _execute(
        """
        CREATE TABLE IF NOT EXISTS routines (
          id TEXT NOT NULL,
          email TEXT NOT NULL REFERENCES profiles(email),
          name TEXT NOT NULL,
          goal TEXT DEFAULT '',
          days_per_week INT DEFAULT 3,
          exercises JSONB DEFAULT '[]',
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          PRIMARY KEY (email, id)
        )
        """
    )
    await _execute(
        """
        CREATE TABLE IF NOT EXISTS workout_log (
          id TEXT NOT NULL,
          email TEXT NOT NULL REFERENCES profiles(email),
          routine_id TEXT DEFAULT '',
          routine_name TEXT DEFAULT '',
          started_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          exercises JSONB DEFAULT '[]',
          PRIMARY KEY (email, id)
        )
        """
    )
    await _execute(
        """
        CREATE TABLE IF NOT EXISTS readiness_checkins (
          id TEXT NOT NULL,
          email TEXT NOT NULL REFERENCES profiles(email),
          sleep_quality INT DEFAULT 5,
          energy INT DEFAULT 5,
          stress INT DEFAULT 5,
          mood INT DEFAULT 5,
          soreness INT DEFAULT 5,
          motivation INT DEFAULT 5,
          notes TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT now(),
          PRIMARY KEY (email, id)
        )
        """
    )
    await _execute(
        """
        CREATE TABLE IF NOT EXISTS users (
          username TEXT PRIMARY KEY,
          password_hash TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE REFERENCES profiles(email),
          role TEXT DEFAULT 'client',
          created_at TIMESTAMPTZ DEFAULT now()
        )
        """
    )
    await _execute(
        """
        CREATE TABLE IF NOT EXISTS labels (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          color TEXT DEFAULT '#00c896',
          created_at TIMESTAMPTZ DEFAULT now()
        )
        """
    )
    await _execute(
        """
        CREATE TABLE IF NOT EXISTS user_labels (
          email TEXT NOT NULL REFERENCES profiles(email),
          label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
          assigned_at TIMESTAMPTZ DEFAULT now(),
          PRIMARY KEY (email, label_id)
        )
        """
    )
    await _execute(
        """
        CREATE TABLE IF NOT EXISTS scheduled_workouts (
          id TEXT PRIMARY KEY,
          client_email TEXT NOT NULL REFERENCES profiles(email),
          routine_id TEXT NOT NULL,
          routine_name TEXT NOT NULL,
          scheduled_date DATE NOT NULL,
          notes TEXT DEFAULT '',
          created_by TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now()
        )
        """
    )
    await _execute(
        """
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
        """
    )
    await _execute(
        "INSERT INTO app_settings (key, value) VALUES ('client_self_schedule', 'true') "
        "ON CONFLICT DO NOTHING"
    )


# ── App settings ──────────────────────────────────────────


async def get_setting(key: str) -> str | None:
    row = await _fetchrow("SELECT value FROM app_settings WHERE key = $1", key)
    return row["value"] if row else None


async def set_setting(key: str, value: str) -> None:
    await _execute(
        "INSERT INTO app_settings (key, value) VALUES ($1, $2) "
        "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        key,
        value,
    )


# ── Seed catalog exercises ────────────────────────────────

CATALOG = [
    {"id": "barbell-back-squat", "name": "Barbell Back Squat", "muscleGroup": "Quads", "category": "Lower Body", "defaultWeight": 185, "defaultSets": 5, "defaultReps": 6},
    {"id": "hack-squat", "name": "Hack Squat", "muscleGroup": "Quads", "category": "Lower Body", "defaultWeight": 126, "defaultSets": 3, "defaultReps": 8},
    {"id": "deadlift", "name": "Deadlift", "muscleGroup": "Posterior Chain", "category": "Lower Body", "defaultWeight": 225, "defaultSets": 3, "defaultReps": 5},
    {"id": "back-extension", "name": "Back Extension", "muscleGroup": "Lower Back", "category": "Posterior Chain", "defaultWeight": 141, "defaultSets": 2, "defaultReps": 10},
    {"id": "lunges", "name": "Lunges", "muscleGroup": "Quads", "category": "Lower Body", "defaultWeight": 40, "defaultSets": 3, "defaultReps": 10},
    {"id": "upright-cable-rows", "name": "Upright Cable Rows", "muscleGroup": "Shoulders", "category": "Upper Body", "defaultWeight": 60, "defaultSets": 5, "defaultReps": 8},
    {"id": "hip-thrust", "name": "Hip Thrust", "muscleGroup": "Glutes", "category": "Lower Body", "defaultWeight": 135, "defaultSets": 3, "defaultReps": 8},
    {"id": "overhead-press", "name": "Overhead Press", "muscleGroup": "Shoulders", "category": "Upper Body", "defaultWeight": 10, "defaultSets": 3, "defaultReps": 8},
    {"id": "leg-press", "name": "Leg Press", "muscleGroup": "Quads", "category": "Lower Body", "defaultWeight": 126, "defaultSets": 3, "defaultReps": 8},
    {"id": "adduction", "name": "Adduction", "muscleGroup": "Adductors", "category": "Lower Body", "defaultWeight": 150, "defaultSets": 2, "defaultReps": 10},
    {"id": "abduction", "name": "Abduction", "muscleGroup": "Abductors", "category": "Lower Body", "defaultWeight": 150, "defaultSets": 2, "defaultReps": 10},
]


async def seed_exercises() -> None:
    row = await _fetchrow("SELECT count(*)::int AS n FROM exercises")
    if row and row["n"] > 0:
        return
    for e in CATALOG:
        await _execute(
            "INSERT INTO exercises (id, name, muscle_group, category, default_weight, default_sets, default_reps) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING",
            e["id"], e["name"], e["muscleGroup"], e["category"],
            e["defaultWeight"], e["defaultSets"], e["defaultReps"],
        )


# ── User auth helpers ─────────────────────────────────────


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


async def create_user(username: str, password_hash: str, email: str, role: str = "client") -> None:
    await ensure_profile(email)
    await _execute(
        "INSERT INTO users (username, password_hash, email, role) VALUES ($1, $2, $3, $4) "
        "ON CONFLICT (username) DO NOTHING",
        username, password_hash, email, role,
    )


async def ensure_google_user(email: str, full_name: str | None = None) -> None:
    await ensure_profile(email)
    if full_name:
        await _execute(
            "UPDATE profiles SET full_name = $1 WHERE email = $2 AND full_name = ''",
            full_name, email,
        )
    existing = await _fetchrow("SELECT email FROM users WHERE email = $1", email)
    if existing:
        return
    username = email.split("@")[0]
    await _execute(
        "INSERT INTO users (username, password_hash, email, role) "
        "VALUES ($1, 'google-oauth', $2, 'client') ON CONFLICT (username) DO NOTHING",
        username, email,
    )


async def get_user_by_username(username: str) -> dict | None:
    row = await _fetchrow("SELECT * FROM users WHERE username = $1", username)
    if not row:
        return None
    return {
        "username": row["username"],
        "passwordHash": row["password_hash"],
        "email": row["email"],
        "role": row["role"],
    }


async def seed_dev_users() -> None:
    row = await _fetchrow("SELECT count(*)::int AS n FROM users")
    if row and row["n"] > 0:
        return
    dev_users = [
        {"username": "admin", "password": "admin", "email": "admin@dev.local", "role": "admin"},
        {"username": "paul", "password": "paul", "email": "paul@dev.local", "role": "client"},
        {"username": "diego", "password": "diego", "email": "diego@dev.local", "role": "client"},
    ]
    for u in dev_users:
        await create_user(u["username"], _sha256(u["password"]), u["email"], u["role"])


_DEV_ROUTINES = [
    {"id": "lower-strength", "email": "paul@dev.local", "name": "Lower Body Strength", "goal": "strength", "daysPerWeek": 3,
     "exercises": [
         {"exerciseId": "barbell-back-squat", "exerciseName": "Barbell Back Squat", "sets": 5, "reps": 5, "weightKg": 84},
         {"exerciseId": "deadlift", "exerciseName": "Deadlift", "sets": 3, "reps": 5, "weightKg": 102},
         {"exerciseId": "leg-press", "exerciseName": "Leg Press", "sets": 3, "reps": 8, "weightKg": 57},
         {"exerciseId": "lunges", "exerciseName": "Lunges", "sets": 3, "reps": 10, "weightKg": 18},
     ]},
    {"id": "upper-push", "email": "paul@dev.local", "name": "Upper Body Push", "goal": "muscle_building", "daysPerWeek": 2,
     "exercises": [
         {"exerciseId": "overhead-press", "exerciseName": "Overhead Press", "sets": 4, "reps": 8, "weightKg": 5},
         {"exerciseId": "upright-cable-rows", "exerciseName": "Upright Cable Rows", "sets": 4, "reps": 10, "weightKg": 27},
     ]},
    {"id": "glute-focus", "email": "paul@dev.local", "name": "Glute Focus", "goal": "muscle_building", "daysPerWeek": 2,
     "exercises": [
         {"exerciseId": "hip-thrust", "exerciseName": "Hip Thrust", "sets": 4, "reps": 10, "weightKg": 61},
         {"exerciseId": "back-extension", "exerciseName": "Back Extension", "sets": 3, "reps": 12, "weightKg": 64},
         {"exerciseId": "adduction", "exerciseName": "Adduction", "sets": 2, "reps": 12, "weightKg": 68},
         {"exerciseId": "abduction", "exerciseName": "Abduction", "sets": 2, "reps": 12, "weightKg": 68},
     ]},
    {"id": "full-body", "email": "diego@dev.local", "name": "Full Body", "goal": "general", "daysPerWeek": 3,
     "exercises": [
         {"exerciseId": "barbell-back-squat", "exerciseName": "Barbell Back Squat", "sets": 3, "reps": 8, "weightKg": 61},
         {"exerciseId": "overhead-press", "exerciseName": "Overhead Press", "sets": 3, "reps": 8, "weightKg": 5},
         {"exerciseId": "deadlift", "exerciseName": "Deadlift", "sets": 3, "reps": 5, "weightKg": 80},
         {"exerciseId": "hip-thrust", "exerciseName": "Hip Thrust", "sets": 3, "reps": 10, "weightKg": 45},
     ]},
    {"id": "leg-endurance", "email": "diego@dev.local", "name": "Leg Endurance", "goal": "endurance", "daysPerWeek": 2,
     "exercises": [
         {"exerciseId": "hack-squat", "exerciseName": "Hack Squat", "sets": 4, "reps": 15, "weightKg": 40},
         {"exerciseId": "leg-press", "exerciseName": "Leg Press", "sets": 4, "reps": 15, "weightKg": 45},
         {"exerciseId": "lunges", "exerciseName": "Lunges", "sets": 3, "reps": 15, "weightKg": 9},
     ]},
]


async def seed_dev_routines() -> None:
    row = await _fetchrow("SELECT count(*)::int AS n FROM routines")
    if row and row["n"] > 0:
        return
    now = _dt_now()
    for r in _DEV_ROUTINES:
        await _execute(
            "INSERT INTO routines (id, email, name, goal, days_per_week, exercises, created_at, updated_at) "
            "VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8) ON CONFLICT DO NOTHING",
            r["id"], r["email"], r["name"], r["goal"], r["daysPerWeek"],
            r["exercises"], now, now,
        )


async def get_user_role(email: str) -> str:
    row = await _fetchrow("SELECT role FROM users WHERE email = $1", email)
    return row["role"] if row else "client"


async def get_all_users() -> list[dict]:
    rows = await _fetch(
        """
        SELECT u.username, u.email, u.role, u.created_at,
               p.full_name, p.age, p.gender
        FROM users u
        LEFT JOIN profiles p ON u.email = p.email
        ORDER BY u.role, u.username
        """
    )
    return [
        {
            "username": r["username"],
            "email": r["email"],
            "role": r["role"],
            "fullName": r["full_name"] or "",
            "age": r["age"] or 0,
            "gender": r["gender"] or "",
            "createdAt": r["created_at"],
        }
        for r in rows
    ]


# ── Labels ────────────────────────────────────────────────


async def get_all_labels() -> list[dict]:
    rows = await _fetch("SELECT * FROM labels ORDER BY name")
    return [
        {"id": r["id"], "name": r["name"], "color": r["color"], "createdAt": r["created_at"]}
        for r in rows
    ]


async def create_label(id: str, name: str, color: str) -> dict:
    await _execute("INSERT INTO labels (id, name, color) VALUES ($1, $2, $3)", id, name, color)
    return {"id": id, "name": name, "color": color}


async def update_label(id: str, name: str, color: str) -> dict | None:
    row = await _fetchrow(
        "UPDATE labels SET name = $1, color = $2 WHERE id = $3 RETURNING *", name, color, id
    )
    if not row:
        return None
    return {"id": row["id"], "name": row["name"], "color": row["color"]}


async def delete_label(id: str) -> None:
    await _execute("DELETE FROM labels WHERE id = $1", id)


async def get_labels_for_all_users() -> dict[str, list[dict]]:
    rows = await _fetch(
        """
        SELECT ul.email, l.id, l.name, l.color FROM user_labels ul
        JOIN labels l ON l.id = ul.label_id
        ORDER BY l.name
        """
    )
    out: dict[str, list[dict]] = {}
    for r in rows:
        out.setdefault(r["email"], []).append(
            {"id": r["id"], "name": r["name"], "color": r["color"]}
        )
    return out


async def set_user_labels(email: str, label_ids: list[str]) -> None:
    await _execute("DELETE FROM user_labels WHERE email = $1", email)
    for label_id in label_ids:
        await _execute(
            "INSERT INTO user_labels (email, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            email, label_id,
        )


# ── Profile helpers ───────────────────────────────────────


async def ensure_profile(email: str) -> None:
    await _execute("INSERT INTO profiles (email) VALUES ($1) ON CONFLICT DO NOTHING", email)


def _to_profile(r: asyncpg.Record) -> dict:
    return {
        "fullName": r["full_name"],
        "age": r["age"],
        "gender": r["gender"],
        "heightCm": r["height_cm"],
        "weightKg": r["weight_kg"],
        "activityLevel": r["activity_level"],
        "units": r["units"],
        "photoUrl": r["photo_url"] or "",
    }


async def get_profile(email: str) -> dict:
    row = await _fetchrow("SELECT * FROM profiles WHERE email = $1", email)
    return _to_profile(row) if row else {}


async def upsert_profile(email: str, p: dict) -> None:
    await _execute(
        """
        INSERT INTO profiles (email, full_name, age, gender, height_cm, weight_kg, activity_level, units, synced_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
        ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name, age = EXCLUDED.age, gender = EXCLUDED.gender,
          height_cm = EXCLUDED.height_cm, weight_kg = EXCLUDED.weight_kg,
          activity_level = EXCLUDED.activity_level, units = EXCLUDED.units, synced_at = now()
        """,
        email,
        p.get("fullName") or "",
        p.get("age") or 0,
        p.get("gender") or "",
        p.get("heightCm") or 0,
        p.get("weightKg") or 0,
        p.get("activityLevel") or "moderate",
        p.get("units") or "lbs",
    )


async def update_profile_photo(email: str, photo_url: str) -> None:
    await _execute(
        "UPDATE profiles SET photo_url = $1, synced_at = now() WHERE email = $2",
        photo_url, email,
    )


# ── Catalog exercises ─────────────────────────────────────


async def get_catalog_exercises() -> list[dict]:
    rows = await _fetch("SELECT * FROM exercises ORDER BY name")
    return [
        {
            "id": r["id"], "name": r["name"], "muscleGroup": r["muscle_group"],
            "category": r["category"], "defaultWeight": r["default_weight"],
            "defaultSets": r["default_sets"], "defaultReps": r["default_reps"],
        }
        for r in rows
    ]


# ── User exercises ────────────────────────────────────────


def _to_user_ex(r: asyncpg.Record) -> dict:
    return {
        "id": r["id"], "name": r["name"], "type": r["type"],
        "muscleGroup": r["muscle_group"], "defaultSets": r["default_sets"],
        "defaultReps": r["default_reps"], "defaultWeightKg": r["default_weight_kg"],
        "media": r["media"] or [], "createdAt": r["created_at"],
    }


async def get_user_exercises(email: str) -> list[dict]:
    rows = await _fetch(
        "SELECT * FROM user_exercises WHERE email = $1 ORDER BY created_at", email
    )
    return [_to_user_ex(r) for r in rows]


async def create_user_exercise(email: str, e: dict, id: str) -> dict:
    await ensure_profile(email)
    await _execute(
        """
        INSERT INTO user_exercises (id, email, name, type, muscle_group, default_sets, default_reps, default_weight_kg, media)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        """,
        id, email, e.get("name") or "", e.get("type") or "strength",
        e.get("muscleGroup") or "", e.get("defaultSets") or 3,
        e.get("defaultReps") or 10, e.get("defaultWeightKg") or 0,
        e.get("media") or [],
    )
    return {**e, "id": id, "createdAt": _now_iso()}


async def update_user_exercise(email: str, id: str, e: dict) -> dict | None:
    media = e["media"] if e.get("media") is not None else None
    row = await _fetchrow(
        """
        UPDATE user_exercises SET
          name = COALESCE($1, name),
          type = COALESCE($2, type),
          muscle_group = COALESCE($3, muscle_group),
          default_sets = COALESCE($4, default_sets),
          default_reps = COALESCE($5, default_reps),
          default_weight_kg = COALESCE($6, default_weight_kg),
          media = COALESCE($7::jsonb, media)
        WHERE email = $8 AND id = $9
        RETURNING *
        """,
        e.get("name"), e.get("type"), e.get("muscleGroup"),
        e.get("defaultSets"), e.get("defaultReps"), e.get("defaultWeightKg"),
        media, email, id,
    )
    return _to_user_ex(row) if row else None


async def delete_user_exercise(email: str, id: str) -> None:
    await _execute("DELETE FROM user_exercises WHERE email = $1 AND id = $2", email, id)


# ── Routines ──────────────────────────────────────────────


def _to_routine(r: asyncpg.Record) -> dict:
    return {
        "id": r["id"], "name": r["name"], "goal": r["goal"],
        "daysPerWeek": r["days_per_week"], "exercises": r["exercises"] or [],
        "createdAt": r["created_at"], "updatedAt": r["updated_at"],
    }


async def get_routines(email: str) -> list[dict]:
    rows = await _fetch(
        "SELECT * FROM routines WHERE email = $1 ORDER BY updated_at DESC", email
    )
    return [_to_routine(r) for r in rows]


async def get_routine(email: str, id: str) -> dict | None:
    row = await _fetchrow("SELECT * FROM routines WHERE email = $1 AND id = $2", email, id)
    return _to_routine(row) if row else None


async def create_routine(email: str, r: dict, id: str) -> dict:
    await ensure_profile(email)
    now = _dt_now()
    await _execute(
        """
        INSERT INTO routines (id, email, name, goal, days_per_week, exercises, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
        """,
        id, email, r.get("name") or "", r.get("goal") or "",
        r.get("daysPerWeek") or 3, r.get("exercises") or [], now, now,
    )
    return {"id": id, **r, "createdAt": now, "updatedAt": now}


async def update_routine(email: str, id: str, r: dict) -> dict | None:
    exercises = r["exercises"] if r.get("exercises") is not None else None
    row = await _fetchrow(
        """
        UPDATE routines SET
          name = COALESCE($1, name),
          goal = COALESCE($2, goal),
          days_per_week = COALESCE($3, days_per_week),
          exercises = COALESCE($4::jsonb, exercises),
          updated_at = now()
        WHERE email = $5 AND id = $6
        RETURNING *
        """,
        r.get("name"), r.get("goal"), r.get("daysPerWeek"), exercises, email, id,
    )
    return _to_routine(row) if row else None


async def delete_routine(email: str, id: str) -> None:
    await _execute("DELETE FROM routines WHERE email = $1 AND id = $2", email, id)


# ── Workout log ───────────────────────────────────────────


def _to_workout(r: asyncpg.Record) -> dict:
    return {
        "id": r["id"], "routineId": r["routine_id"], "routineName": r["routine_name"],
        "startedAt": r["started_at"], "completedAt": r["completed_at"],
        "exercises": r["exercises"] or [],
    }


async def get_workout_log(email: str, limit: int) -> list[dict]:
    if limit > 0:
        rows = await _fetch(
            "SELECT * FROM workout_log WHERE email = $1 ORDER BY completed_at DESC LIMIT $2",
            email, limit,
        )
    else:
        rows = await _fetch(
            "SELECT * FROM workout_log WHERE email = $1 ORDER BY completed_at DESC", email
        )
    return [_to_workout(r) for r in rows]


async def create_workout_log(email: str, w: dict, id: str) -> dict:
    await ensure_profile(email)
    await _execute(
        """
        INSERT INTO workout_log (id, email, routine_id, routine_name, started_at, completed_at, exercises)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        """,
        id, email, w.get("routineId") or "", w.get("routineName") or "",
        _to_dt(w.get("startedAt")), _to_dt(w.get("completedAt")), w.get("exercises") or [],
    )
    return {"id": id, **w}


async def get_workout_log_entry(email: str, id: str) -> dict | None:
    row = await _fetchrow("SELECT * FROM workout_log WHERE email = $1 AND id = $2", email, id)
    return _to_workout(row) if row else None


# ── Readiness check-ins ───────────────────────────────────


def _to_readiness(r: asyncpg.Record) -> dict:
    return {
        "id": r["id"], "sleepQuality": r["sleep_quality"], "energy": r["energy"],
        "stress": r["stress"], "mood": r["mood"], "soreness": r["soreness"],
        "motivation": r["motivation"], "notes": r["notes"], "createdAt": r["created_at"],
    }


async def get_readiness_checkins(email: str, limit: int) -> list[dict]:
    if limit > 0:
        rows = await _fetch(
            "SELECT * FROM readiness_checkins WHERE email = $1 ORDER BY created_at DESC LIMIT $2",
            email, limit,
        )
    else:
        rows = await _fetch(
            "SELECT * FROM readiness_checkins WHERE email = $1 ORDER BY created_at DESC", email
        )
    return [_to_readiness(r) for r in rows]


async def create_readiness_checkin(email: str, c: dict, id: str) -> dict:
    await ensure_profile(email)
    await _execute(
        """
        INSERT INTO readiness_checkins (id, email, sleep_quality, energy, stress, mood, soreness, motivation, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """,
        id, email, c.get("sleepQuality") or 5, c.get("energy") or 5,
        c.get("stress") or 5, c.get("mood") or 5, c.get("soreness") or 5,
        c.get("motivation") or 5, c.get("notes") or "",
    )
    return {"id": id, **c, "createdAt": _now_iso()}


async def update_readiness_checkin(email: str, id: str, c: dict) -> dict | None:
    row = await _fetchrow(
        """
        UPDATE readiness_checkins SET
          sleep_quality = $1, energy = $2, stress = $3, mood = $4,
          soreness = $5, motivation = $6, notes = $7
        WHERE email = $8 AND id = $9
        RETURNING *
        """,
        c.get("sleepQuality") or 5, c.get("energy") or 5, c.get("stress") or 5,
        c.get("mood") or 5, c.get("soreness") or 5, c.get("motivation") or 5,
        c.get("notes") or "", email, id,
    )
    return _to_readiness(row) if row else None


async def delete_readiness_checkin(email: str, id: str) -> None:
    await _execute("DELETE FROM readiness_checkins WHERE email = $1 AND id = $2", email, id)


# ── Scheduled workouts ────────────────────────────────────


def _to_scheduled(r: asyncpg.Record) -> dict:
    return {
        "id": r["id"],
        "clientEmail": r["client_email"],
        "routineId": r["routine_id"],
        "routineName": r["routine_name"],
        "scheduledDate": r["scheduled_date"],
        "notes": r["notes"] or "",
        "createdBy": r["created_by"],
        "createdAt": r["created_at"],
    }


async def get_scheduled_workouts(client_email: str, frm: str, to: str) -> list[dict]:
    rows = await _fetch(
        """
        SELECT * FROM scheduled_workouts
        WHERE client_email = $1 AND scheduled_date >= $2 AND scheduled_date <= $3
        ORDER BY scheduled_date
        """,
        client_email, _to_date(frm), _to_date(to),
    )
    return [_to_scheduled(r) for r in rows]


async def get_scheduled_workouts_for_all(frm: str, to: str) -> list[dict]:
    rows = await _fetch(
        """
        SELECT sw.*, p.full_name FROM scheduled_workouts sw
        LEFT JOIN profiles p ON sw.client_email = p.email
        WHERE sw.scheduled_date >= $1 AND sw.scheduled_date <= $2
        ORDER BY sw.scheduled_date, sw.client_email
        """,
        _to_date(frm), _to_date(to),
    )
    return [{**_to_scheduled(r), "clientName": r["full_name"] or ""} for r in rows]


async def create_scheduled_workout(id: str, sw: dict) -> dict:
    await ensure_profile(sw["clientEmail"])
    await _execute(
        """
        INSERT INTO scheduled_workouts (id, client_email, routine_id, routine_name, scheduled_date, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        """,
        id, sw["clientEmail"], sw["routineId"], sw["routineName"],
        _to_date(sw["scheduledDate"]), sw.get("notes") or "", sw["createdBy"],
    )
    return {"id": id, **sw, "createdAt": _now_iso()}


async def delete_scheduled_workout(id: str) -> None:
    await _execute("DELETE FROM scheduled_workouts WHERE id = $1", id)


async def get_all_routines_admin() -> list[dict]:
    rows = await _fetch(
        """
        SELECT r.*, p.full_name FROM routines r
        LEFT JOIN profiles p ON r.email = p.email
        ORDER BY r.email, r.name
        """
    )
    return [
        {**_to_routine(r), "email": r["email"], "ownerName": r["full_name"] or ""}
        for r in rows
    ]


# ── Admin stats (aggregate) ───────────────────────────────


async def get_admin_stats() -> dict:
    user_counts = await _fetchrow(
        """
        SELECT
          count(*)::int AS total,
          count(*) FILTER (WHERE role = 'client')::int AS clients,
          count(*) FILTER (WHERE role = 'admin')::int AS admins
        FROM users
        """
    )
    routine_count = await _fetchrow("SELECT count(*)::int AS n FROM routines")
    exercise_count = await _fetchrow("SELECT count(*)::int AS n FROM exercises")
    user_exercise_count = await _fetchrow("SELECT count(*)::int AS n FROM user_exercises")
    workout_counts = await _fetchrow(
        """
        SELECT
          count(*)::int AS total,
          count(*) FILTER (WHERE completed_at >= now() - interval '7 days')::int AS this_week
        FROM workout_log
        """
    )
    checkin_counts = await _fetchrow(
        """
        SELECT
          count(*)::int AS total,
          count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS this_week
        FROM readiness_checkins
        """
    )
    knowledge_exists = await _fetchrow(
        """
        SELECT count(*)::int AS n FROM (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_knowledge'
        ) t
        """
    )
    knowledge_chunks = 0
    if knowledge_exists and knowledge_exists["n"] > 0:
        kc = await _fetchrow("SELECT count(*)::int AS n FROM exercise_knowledge")
        knowledge_chunks = kc["n"]

    return {
        "users": {
            "total": user_counts["total"],
            "clients": user_counts["clients"],
            "admins": user_counts["admins"],
        },
        "routines": routine_count["n"],
        "exercises": {"catalog": exercise_count["n"], "custom": user_exercise_count["n"]},
        "workouts": {"total": workout_counts["total"], "thisWeek": workout_counts["this_week"]},
        "checkins": {"total": checkin_counts["total"], "thisWeek": checkin_counts["this_week"]},
        "knowledgeChunks": knowledge_chunks,
    }


async def get_client_summaries() -> list[dict]:
    rows = await _fetch(
        """
        SELECT
          u.email,
          u.username,
          p.full_name,
          u.created_at,
          (SELECT count(*)::int FROM routines r WHERE r.email = u.email) AS routine_count,
          (SELECT count(*)::int FROM workout_log w WHERE w.email = u.email) AS workout_count,
          (SELECT max(w.completed_at) FROM workout_log w WHERE w.email = u.email) AS last_workout,
          (SELECT count(*)::int FROM readiness_checkins rc WHERE rc.email = u.email) AS checkin_count,
          (SELECT max(rc.created_at) FROM readiness_checkins rc WHERE rc.email = u.email) AS last_checkin
        FROM users u
        LEFT JOIN profiles p ON u.email = p.email
        WHERE u.role = 'client'
        ORDER BY p.full_name, u.username
        """
    )
    return [
        {
            "email": r["email"],
            "username": r["username"],
            "fullName": r["full_name"] or "",
            "createdAt": r["created_at"],
            "routineCount": r["routine_count"],
            "workoutCount": r["workout_count"],
            "lastWorkout": r["last_workout"],
            "checkinCount": r["checkin_count"],
            "lastCheckin": r["last_checkin"],
        }
        for r in rows
    ]


async def get_recent_workouts_all(limit: int) -> list[dict]:
    rows = await _fetch(
        """
        SELECT w.*, p.full_name FROM workout_log w
        LEFT JOIN profiles p ON w.email = p.email
        ORDER BY w.completed_at DESC
        LIMIT $1
        """,
        limit,
    )
    return [
        {**_to_workout(r), "email": r["email"], "clientName": r["full_name"] or ""}
        for r in rows
    ]
