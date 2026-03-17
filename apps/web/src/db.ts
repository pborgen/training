import postgres from "postgres";

let _sql: postgres.Sql | null = null;

function sql(): postgres.Sql {
  if (!_sql) {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) throw new Error("POSTGRES_URL is not set");
    _sql = postgres(url);
  }
  return _sql;
}

/* ── Schema ─────────────────────────────────── */

export async function ensureTables() {
  await sql()`
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
  `;
  // Migration: add photo_url column if missing
  try { await sql()`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT ''`; } catch {};

  await sql()`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      category TEXT NOT NULL,
      default_weight REAL DEFAULT 0,
      default_sets INT DEFAULT 3,
      default_reps INT DEFAULT 10
    )
  `;
  await sql()`
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
  `;
  // Migration: add media column if missing
  try { await sql()`ALTER TABLE user_exercises ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'`; } catch {};
  await sql()`
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
  `;
  await sql()`
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
  `;
  await sql()`
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
  `;
  await sql()`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE REFERENCES profiles(email),
      role TEXT DEFAULT 'client',
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  await sql()`
    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#00c896',
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  await sql()`
    CREATE TABLE IF NOT EXISTS user_labels (
      email TEXT NOT NULL REFERENCES profiles(email),
      label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
      assigned_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (email, label_id)
    )
  `;
  await sql()`
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
  `;
  await sql()`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
  // Default: clients can self-schedule
  await sql()`INSERT INTO app_settings (key, value) VALUES ('client_self_schedule', 'true') ON CONFLICT DO NOTHING`;
}

/* ── App settings ──────────────────────────── */

export async function getSetting(key: string): Promise<string | null> {
  const rows = await sql()`SELECT value FROM app_settings WHERE key = ${key}`;
  return rows[0] ? (rows[0].value as string) : null;
}

export async function setSetting(key: string, value: string) {
  await sql()`
    INSERT INTO app_settings (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

/* ── Seed catalog exercises ─────────────────── */

const CATALOG = [
  { id: "barbell-back-squat", name: "Barbell Back Squat", muscleGroup: "Quads", category: "Lower Body", defaultWeight: 185, defaultSets: 5, defaultReps: 6 },
  { id: "hack-squat", name: "Hack Squat", muscleGroup: "Quads", category: "Lower Body", defaultWeight: 126, defaultSets: 3, defaultReps: 8 },
  { id: "deadlift", name: "Deadlift", muscleGroup: "Posterior Chain", category: "Lower Body", defaultWeight: 225, defaultSets: 3, defaultReps: 5 },
  { id: "back-extension", name: "Back Extension", muscleGroup: "Lower Back", category: "Posterior Chain", defaultWeight: 141, defaultSets: 2, defaultReps: 10 },
  { id: "lunges", name: "Lunges", muscleGroup: "Quads", category: "Lower Body", defaultWeight: 40, defaultSets: 3, defaultReps: 10 },
  { id: "upright-cable-rows", name: "Upright Cable Rows", muscleGroup: "Shoulders", category: "Upper Body", defaultWeight: 60, defaultSets: 5, defaultReps: 8 },
  { id: "hip-thrust", name: "Hip Thrust", muscleGroup: "Glutes", category: "Lower Body", defaultWeight: 135, defaultSets: 3, defaultReps: 8 },
  { id: "overhead-press", name: "Overhead Press", muscleGroup: "Shoulders", category: "Upper Body", defaultWeight: 10, defaultSets: 3, defaultReps: 8 },
  { id: "leg-press", name: "Leg Press", muscleGroup: "Quads", category: "Lower Body", defaultWeight: 126, defaultSets: 3, defaultReps: 8 },
  { id: "adduction", name: "Adduction", muscleGroup: "Adductors", category: "Lower Body", defaultWeight: 150, defaultSets: 2, defaultReps: 10 },
  { id: "abduction", name: "Abduction", muscleGroup: "Abductors", category: "Lower Body", defaultWeight: 150, defaultSets: 2, defaultReps: 10 },
];

export async function seedExercises() {
  const rows = await sql()`SELECT count(*)::int AS n FROM exercises`;
  if (rows[0].n > 0) return;
  for (const e of CATALOG) {
    await sql()`
      INSERT INTO exercises (id, name, muscle_group, category, default_weight, default_sets, default_reps)
      VALUES (${e.id}, ${e.name}, ${e.muscleGroup}, ${e.category}, ${e.defaultWeight}, ${e.defaultSets}, ${e.defaultReps})
      ON CONFLICT DO NOTHING
    `;
  }
}

/* ── User auth helpers ──────────────────────── */

export async function createUser(username: string, passwordHash: string, email: string, role = "client") {
  await ensureProfile(email);
  await sql()`
    INSERT INTO users (username, password_hash, email, role)
    VALUES (${username}, ${passwordHash}, ${email}, ${role})
    ON CONFLICT (username) DO NOTHING
  `;
}

export async function ensureGoogleUser(email: string, fullName?: string) {
  await ensureProfile(email);
  if (fullName) {
    await sql()`UPDATE profiles SET full_name = ${fullName} WHERE email = ${email} AND full_name = ''`;
  }
  const existing = await sql()`SELECT email FROM users WHERE email = ${email}`;
  if (existing.length > 0) return;
  const username = email.split("@")[0];
  await sql()`
    INSERT INTO users (username, password_hash, email, role)
    VALUES (${username}, 'google-oauth', ${email}, 'client')
    ON CONFLICT (username) DO NOTHING
  `;
}

export async function getUserByUsername(username: string) {
  const rows = await sql()`SELECT * FROM users WHERE username = ${username}`;
  return rows[0] ? { username: rows[0].username as string, passwordHash: rows[0].password_hash as string, email: rows[0].email as string, role: rows[0].role as string } : null;
}

export async function seedDevUsers() {
  const rows = await sql()`SELECT count(*)::int AS n FROM users`;
  if (rows[0].n > 0) return;
  // Default dev users — passwords are plaintext hashed with crypto.createHash for simplicity
  const devUsers = [
    { username: "admin", password: "admin", email: "admin@dev.local", role: "admin" },
    { username: "paul", password: "paul", email: "paul@dev.local", role: "client" },
    { username: "diego", password: "diego", email: "diego@dev.local", role: "client" },
  ];
  for (const u of devUsers) {
    const hash = (await import("node:crypto")).createHash("sha256").update(u.password).digest("hex");
    await createUser(u.username, hash, u.email, u.role);
  }
}

export async function seedDevRoutines() {
  const rows = await sql()`SELECT count(*)::int AS n FROM routines`;
  if (rows[0].n > 0) return;

  const routines = [
    {
      id: "lower-strength", email: "paul@dev.local", name: "Lower Body Strength", goal: "strength", daysPerWeek: 3,
      exercises: [
        { exerciseId: "barbell-back-squat", exerciseName: "Barbell Back Squat", sets: 5, reps: 5, weightKg: 84 },
        { exerciseId: "deadlift", exerciseName: "Deadlift", sets: 3, reps: 5, weightKg: 102 },
        { exerciseId: "leg-press", exerciseName: "Leg Press", sets: 3, reps: 8, weightKg: 57 },
        { exerciseId: "lunges", exerciseName: "Lunges", sets: 3, reps: 10, weightKg: 18 },
      ],
    },
    {
      id: "upper-push", email: "paul@dev.local", name: "Upper Body Push", goal: "muscle_building", daysPerWeek: 2,
      exercises: [
        { exerciseId: "overhead-press", exerciseName: "Overhead Press", sets: 4, reps: 8, weightKg: 5 },
        { exerciseId: "upright-cable-rows", exerciseName: "Upright Cable Rows", sets: 4, reps: 10, weightKg: 27 },
      ],
    },
    {
      id: "glute-focus", email: "paul@dev.local", name: "Glute Focus", goal: "muscle_building", daysPerWeek: 2,
      exercises: [
        { exerciseId: "hip-thrust", exerciseName: "Hip Thrust", sets: 4, reps: 10, weightKg: 61 },
        { exerciseId: "back-extension", exerciseName: "Back Extension", sets: 3, reps: 12, weightKg: 64 },
        { exerciseId: "adduction", exerciseName: "Adduction", sets: 2, reps: 12, weightKg: 68 },
        { exerciseId: "abduction", exerciseName: "Abduction", sets: 2, reps: 12, weightKg: 68 },
      ],
    },
    {
      id: "full-body", email: "diego@dev.local", name: "Full Body", goal: "general", daysPerWeek: 3,
      exercises: [
        { exerciseId: "barbell-back-squat", exerciseName: "Barbell Back Squat", sets: 3, reps: 8, weightKg: 61 },
        { exerciseId: "overhead-press", exerciseName: "Overhead Press", sets: 3, reps: 8, weightKg: 5 },
        { exerciseId: "deadlift", exerciseName: "Deadlift", sets: 3, reps: 5, weightKg: 80 },
        { exerciseId: "hip-thrust", exerciseName: "Hip Thrust", sets: 3, reps: 10, weightKg: 45 },
      ],
    },
    {
      id: "leg-endurance", email: "diego@dev.local", name: "Leg Endurance", goal: "endurance", daysPerWeek: 2,
      exercises: [
        { exerciseId: "hack-squat", exerciseName: "Hack Squat", sets: 4, reps: 15, weightKg: 40 },
        { exerciseId: "leg-press", exerciseName: "Leg Press", sets: 4, reps: 15, weightKg: 45 },
        { exerciseId: "lunges", exerciseName: "Lunges", sets: 3, reps: 15, weightKg: 9 },
      ],
    },
  ];

  const now = new Date().toISOString();
  for (const r of routines) {
    const exercises = JSON.stringify(r.exercises);
    await sql()`
      INSERT INTO routines (id, email, name, goal, days_per_week, exercises, created_at, updated_at)
      VALUES (${r.id}, ${r.email}, ${r.name}, ${r.goal}, ${r.daysPerWeek}, ${exercises}::jsonb, ${now}, ${now})
      ON CONFLICT DO NOTHING
    `;
  }
}

export async function getUserRole(email: string): Promise<string> {
  const rows = await sql()`SELECT role FROM users WHERE email = ${email}`;
  return rows[0]?.role as string || "client";
}

export async function getAllUsers() {
  const rows = await sql()`
    SELECT u.username, u.email, u.role, u.created_at,
           p.full_name, p.age, p.gender
    FROM users u
    LEFT JOIN profiles p ON u.email = p.email
    ORDER BY u.role, u.username
  `;
  return rows.map(r => ({
    username: r.username,
    email: r.email,
    role: r.role,
    fullName: r.full_name || "",
    age: r.age || 0,
    gender: r.gender || "",
    createdAt: r.created_at,
  }));
}

/* ── Labels ────────────────────────────────── */

export async function getAllLabels() {
  const rows = await sql()`SELECT * FROM labels ORDER BY name`;
  return rows.map(r => ({ id: r.id as string, name: r.name as string, color: r.color as string, createdAt: r.created_at }));
}

export async function createLabel(id: string, name: string, color: string) {
  await sql()`INSERT INTO labels (id, name, color) VALUES (${id}, ${name}, ${color})`;
  return { id, name, color };
}

export async function updateLabel(id: string, name: string, color: string) {
  const rows = await sql()`UPDATE labels SET name = ${name}, color = ${color} WHERE id = ${id} RETURNING *`;
  return rows[0] ? { id: rows[0].id as string, name: rows[0].name as string, color: rows[0].color as string } : null;
}

export async function deleteLabel(id: string) {
  await sql()`DELETE FROM labels WHERE id = ${id}`;
}

export async function getLabelsForUser(email: string) {
  const rows = await sql()`
    SELECT l.id, l.name, l.color FROM labels l
    JOIN user_labels ul ON l.id = ul.label_id
    WHERE ul.email = ${email}
    ORDER BY l.name
  `;
  return rows.map(r => ({ id: r.id as string, name: r.name as string, color: r.color as string }));
}

export async function getLabelsForAllUsers() {
  const rows = await sql()`
    SELECT ul.email, l.id, l.name, l.color FROM user_labels ul
    JOIN labels l ON l.id = ul.label_id
    ORDER BY l.name
  `;
  const map: Record<string, { id: string; name: string; color: string }[]> = {};
  for (const r of rows) {
    const email = r.email as string;
    if (!map[email]) map[email] = [];
    map[email].push({ id: r.id as string, name: r.name as string, color: r.color as string });
  }
  return map;
}

export async function setUserLabels(email: string, labelIds: string[]) {
  await sql()`DELETE FROM user_labels WHERE email = ${email}`;
  for (const labelId of labelIds) {
    await sql()`INSERT INTO user_labels (email, label_id) VALUES (${email}, ${labelId}) ON CONFLICT DO NOTHING`;
  }
}

/* ── Profile helpers ────────────────────────── */

export async function ensureProfile(email: string) {
  await sql()`INSERT INTO profiles (email) VALUES (${email}) ON CONFLICT DO NOTHING`;
}

export async function getProfile(email: string) {
  const rows = await sql()`SELECT * FROM profiles WHERE email = ${email}`;
  return rows[0] ? toProfileObj(rows[0]) : {};
}

export async function upsertProfile(email: string, p: Record<string, unknown>) {
  await sql()`
    INSERT INTO profiles (email, full_name, age, gender, height_cm, weight_kg, activity_level, units, synced_at)
    VALUES (${email}, ${(p.fullName as string) || ""}, ${(p.age as number) || 0}, ${(p.gender as string) || ""},
            ${(p.heightCm as number) || 0}, ${(p.weightKg as number) || 0},
            ${(p.activityLevel as string) || "moderate"}, ${(p.units as string) || "lbs"}, now())
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name, age = EXCLUDED.age, gender = EXCLUDED.gender,
      height_cm = EXCLUDED.height_cm, weight_kg = EXCLUDED.weight_kg,
      activity_level = EXCLUDED.activity_level, units = EXCLUDED.units, synced_at = now()
  `;
}

export async function updateProfilePhoto(email: string, photoUrl: string) {
  await sql()`UPDATE profiles SET photo_url = ${photoUrl}, synced_at = now() WHERE email = ${email}`;
}

function toProfileObj(r: Record<string, unknown>) {
  return {
    fullName: r.full_name, age: r.age, gender: r.gender,
    heightCm: r.height_cm, weightKg: r.weight_kg,
    activityLevel: r.activity_level, units: r.units,
    photoUrl: r.photo_url || "",
  };
}

/* ── Catalog exercises ──────────────────────── */

export async function getCatalogExercises() {
  const rows = await sql()`SELECT * FROM exercises ORDER BY name`;
  return rows.map((r) => ({
    id: r.id, name: r.name, muscleGroup: r.muscle_group, category: r.category,
    defaultWeight: r.default_weight, defaultSets: r.default_sets, defaultReps: r.default_reps,
  }));
}

/* ── User exercises ─────────────────────────── */

export async function getUserExercises(email: string) {
  const rows = await sql()`SELECT * FROM user_exercises WHERE email = ${email} ORDER BY created_at`;
  return rows.map(toUserExObj);
}

export async function createUserExercise(email: string, e: Record<string, unknown>, id: string) {
  await ensureProfile(email);
  const media = JSON.stringify(e.media || []);
  await sql()`
    INSERT INTO user_exercises (id, email, name, type, muscle_group, default_sets, default_reps, default_weight_kg, media)
    VALUES (${id}, ${email}, ${(e.name as string) || ""}, ${(e.type as string) || "strength"},
            ${(e.muscleGroup as string) || ""}, ${(e.defaultSets as number) || 3},
            ${(e.defaultReps as number) || 10}, ${(e.defaultWeightKg as number) || 0}, ${media}::jsonb)
  `;
  return { ...e, id, createdAt: new Date().toISOString() };
}

export async function updateUserExercise(email: string, id: string, e: Record<string, unknown>) {
  const media = e.media != null ? JSON.stringify(e.media) : null;
  const rows = await sql()`
    UPDATE user_exercises SET
      name = COALESCE(${(e.name as string) ?? null}, name),
      type = COALESCE(${(e.type as string) ?? null}, type),
      muscle_group = COALESCE(${(e.muscleGroup as string) ?? null}, muscle_group),
      default_sets = COALESCE(${(e.defaultSets as number) ?? null}, default_sets),
      default_reps = COALESCE(${(e.defaultReps as number) ?? null}, default_reps),
      default_weight_kg = COALESCE(${(e.defaultWeightKg as number) ?? null}, default_weight_kg),
      media = COALESCE(${media}::jsonb, media)
    WHERE email = ${email} AND id = ${id}
    RETURNING *
  `;
  return rows[0] ? toUserExObj(rows[0]) : null;
}

export async function deleteUserExercise(email: string, id: string) {
  await sql()`DELETE FROM user_exercises WHERE email = ${email} AND id = ${id}`;
}

function parseJsonb(val: unknown): unknown[] {
  if (typeof val === "string") return JSON.parse(val);
  return (val as unknown[]) || [];
}

function toUserExObj(r: Record<string, unknown>) {
  return {
    id: r.id, name: r.name, type: r.type, muscleGroup: r.muscle_group,
    defaultSets: r.default_sets, defaultReps: r.default_reps,
    defaultWeightKg: r.default_weight_kg, media: parseJsonb(r.media), createdAt: r.created_at,
  };
}

/* ── Routines ───────────────────────────────── */

export async function getRoutines(email: string) {
  const rows = await sql()`SELECT * FROM routines WHERE email = ${email} ORDER BY updated_at DESC`;
  return rows.map(toRoutineObj);
}

export async function getRoutine(email: string, id: string) {
  const rows = await sql()`SELECT * FROM routines WHERE email = ${email} AND id = ${id}`;
  return rows[0] ? toRoutineObj(rows[0]) : null;
}

export async function createRoutine(email: string, r: Record<string, unknown>, id: string) {
  await ensureProfile(email);
  const now = new Date().toISOString();
  const exercises = JSON.stringify(r.exercises || []);
  await sql()`
    INSERT INTO routines (id, email, name, goal, days_per_week, exercises, created_at, updated_at)
    VALUES (${id}, ${email}, ${(r.name as string) || ""}, ${(r.goal as string) || ""},
            ${(r.daysPerWeek as number) || 3}, ${exercises}::jsonb, ${now}, ${now})
  `;
  return { id, ...r, createdAt: now, updatedAt: now };
}

export async function updateRoutine(email: string, id: string, r: Record<string, unknown>) {
  const exercises = r.exercises != null ? JSON.stringify(r.exercises) : null;
  const rows = await sql()`
    UPDATE routines SET
      name = COALESCE(${(r.name as string) ?? null}, name),
      goal = COALESCE(${(r.goal as string) ?? null}, goal),
      days_per_week = COALESCE(${(r.daysPerWeek as number) ?? null}, days_per_week),
      exercises = COALESCE(${exercises}::jsonb, exercises),
      updated_at = now()
    WHERE email = ${email} AND id = ${id}
    RETURNING *
  `;
  return rows[0] ? toRoutineObj(rows[0]) : null;
}

export async function deleteRoutine(email: string, id: string) {
  await sql()`DELETE FROM routines WHERE email = ${email} AND id = ${id}`;
}

function toRoutineObj(r: Record<string, unknown>) {
  return {
    id: r.id, name: r.name, goal: r.goal, daysPerWeek: r.days_per_week,
    exercises: parseJsonb(r.exercises), createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

/* ── Workout log ────────────────────────────── */

export async function getWorkoutLog(email: string, limit: number) {
  if (limit > 0) {
    return (await sql()`SELECT * FROM workout_log WHERE email = ${email} ORDER BY completed_at DESC LIMIT ${limit}`).map(toWorkoutObj);
  }
  return (await sql()`SELECT * FROM workout_log WHERE email = ${email} ORDER BY completed_at DESC`).map(toWorkoutObj);
}

export async function createWorkoutLog(email: string, w: Record<string, unknown>, id: string) {
  await ensureProfile(email);
  const exercises = JSON.stringify(w.exercises || []);
  await sql()`
    INSERT INTO workout_log (id, email, routine_id, routine_name, started_at, completed_at, exercises)
    VALUES (${id}, ${email}, ${(w.routineId as string) || ""}, ${(w.routineName as string) || ""},
            ${(w.startedAt as string) || null}, ${(w.completedAt as string) || null}, ${exercises}::jsonb)
  `;
  return { id, ...w };
}

export async function getWorkoutLogEntry(email: string, id: string) {
  const rows = await sql()`SELECT * FROM workout_log WHERE email = ${email} AND id = ${id}`;
  return rows[0] ? toWorkoutObj(rows[0]) : null;
}

function toWorkoutObj(r: Record<string, unknown>) {
  return {
    id: r.id, routineId: r.routine_id, routineName: r.routine_name,
    startedAt: r.started_at, completedAt: r.completed_at, exercises: parseJsonb(r.exercises),
  };
}

/* ── Readiness check-ins ────────────────────── */

export async function getReadinessCheckins(email: string, limit: number) {
  if (limit > 0) {
    return (await sql()`SELECT * FROM readiness_checkins WHERE email = ${email} ORDER BY created_at DESC LIMIT ${limit}`).map(toReadinessObj);
  }
  return (await sql()`SELECT * FROM readiness_checkins WHERE email = ${email} ORDER BY created_at DESC`).map(toReadinessObj);
}

export async function createReadinessCheckin(email: string, c: Record<string, unknown>, id: string) {
  await ensureProfile(email);
  await sql()`
    INSERT INTO readiness_checkins (id, email, sleep_quality, energy, stress, mood, soreness, motivation, notes)
    VALUES (${id}, ${email}, ${(c.sleepQuality as number) || 5}, ${(c.energy as number) || 5},
            ${(c.stress as number) || 5}, ${(c.mood as number) || 5},
            ${(c.soreness as number) || 5}, ${(c.motivation as number) || 5},
            ${(c.notes as string) || ""})
  `;
  return { id, ...c, createdAt: new Date().toISOString() };
}

export async function updateReadinessCheckin(email: string, id: string, c: Record<string, unknown>) {
  const rows = await sql()`
    UPDATE readiness_checkins SET
      sleep_quality = ${(c.sleepQuality as number) || 5},
      energy = ${(c.energy as number) || 5},
      stress = ${(c.stress as number) || 5},
      mood = ${(c.mood as number) || 5},
      soreness = ${(c.soreness as number) || 5},
      motivation = ${(c.motivation as number) || 5},
      notes = ${(c.notes as string) || ""}
    WHERE email = ${email} AND id = ${id}
    RETURNING *
  `;
  return rows[0] ? toReadinessObj(rows[0]) : null;
}

export async function deleteReadinessCheckin(email: string, id: string) {
  await sql()`DELETE FROM readiness_checkins WHERE email = ${email} AND id = ${id}`;
}

function toReadinessObj(r: Record<string, unknown>) {
  return {
    id: r.id, sleepQuality: r.sleep_quality, energy: r.energy, stress: r.stress,
    mood: r.mood, soreness: r.soreness, motivation: r.motivation,
    notes: r.notes, createdAt: r.created_at,
  };
}

/* ── Scheduled workouts ────────────────── */

export async function getScheduledWorkouts(clientEmail: string, from: string, to: string) {
  const rows = await sql()`
    SELECT * FROM scheduled_workouts
    WHERE client_email = ${clientEmail} AND scheduled_date >= ${from}::date AND scheduled_date <= ${to}::date
    ORDER BY scheduled_date
  `;
  return rows.map(toScheduledObj);
}

export async function getScheduledWorkoutsForAll(from: string, to: string) {
  const rows = await sql()`
    SELECT sw.*, p.full_name FROM scheduled_workouts sw
    LEFT JOIN profiles p ON sw.client_email = p.email
    WHERE sw.scheduled_date >= ${from}::date AND sw.scheduled_date <= ${to}::date
    ORDER BY sw.scheduled_date, sw.client_email
  `;
  return rows.map(r => ({ ...toScheduledObj(r), clientName: (r.full_name as string) || "" }));
}

export async function createScheduledWorkout(id: string, sw: Record<string, unknown>) {
  await ensureProfile(sw.clientEmail as string);
  await sql()`
    INSERT INTO scheduled_workouts (id, client_email, routine_id, routine_name, scheduled_date, notes, created_by)
    VALUES (${id}, ${sw.clientEmail as string}, ${sw.routineId as string}, ${sw.routineName as string},
            ${sw.scheduledDate as string}::date, ${(sw.notes as string) || ""}, ${sw.createdBy as string})
  `;
  return { id, ...sw, createdAt: new Date().toISOString() };
}

export async function deleteScheduledWorkout(id: string) {
  await sql()`DELETE FROM scheduled_workouts WHERE id = ${id}`;
}

export async function getAllRoutinesAdmin() {
  const rows = await sql()`
    SELECT r.*, p.full_name FROM routines r
    LEFT JOIN profiles p ON r.email = p.email
    ORDER BY r.email, r.name
  `;
  return rows.map(r => ({
    ...toRoutineObj(r),
    email: r.email as string,
    ownerName: (r.full_name as string) || "",
  }));
}

function toScheduledObj(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    clientEmail: r.client_email as string,
    routineId: r.routine_id as string,
    routineName: r.routine_name as string,
    scheduledDate: r.scheduled_date as string,
    notes: (r.notes as string) || "",
    createdBy: r.created_by as string,
    createdAt: r.created_at as string,
  };
}

/* ── Admin stats (aggregate) ──────────────── */

export async function getAdminStats() {
  const [userCounts] = await sql()`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE role = 'client')::int AS clients,
      count(*) FILTER (WHERE role = 'admin')::int AS admins
    FROM users
  `;
  const [routineCount] = await sql()`SELECT count(*)::int AS n FROM routines`;
  const [exerciseCount] = await sql()`SELECT count(*)::int AS n FROM exercises`;
  const [userExerciseCount] = await sql()`SELECT count(*)::int AS n FROM user_exercises`;
  const [workoutCounts] = await sql()`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE completed_at >= now() - interval '7 days')::int AS this_week
    FROM workout_log
  `;
  const [checkinCounts] = await sql()`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS this_week
    FROM readiness_checkins
  `;
  const [knowledgeCount] = await sql()`
    SELECT count(*)::int AS n FROM (
      SELECT 1 FROM information_schema.tables WHERE table_name = 'exercise_knowledge'
    ) t
  `;
  let knowledgeChunks = 0;
  if (knowledgeCount.n > 0) {
    const [kc] = await sql()`SELECT count(*)::int AS n FROM exercise_knowledge`;
    knowledgeChunks = kc.n;
  }

  return {
    users: { total: userCounts.total, clients: userCounts.clients, admins: userCounts.admins },
    routines: routineCount.n as number,
    exercises: { catalog: exerciseCount.n as number, custom: userExerciseCount.n as number },
    workouts: { total: workoutCounts.total, thisWeek: workoutCounts.this_week },
    checkins: { total: checkinCounts.total, thisWeek: checkinCounts.this_week },
    knowledgeChunks,
  };
}

export async function getClientSummaries() {
  const rows = await sql()`
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
  `;
  return rows.map(r => ({
    email: r.email as string,
    username: r.username as string,
    fullName: (r.full_name as string) || "",
    createdAt: r.created_at as string,
    routineCount: r.routine_count as number,
    workoutCount: r.workout_count as number,
    lastWorkout: r.last_workout as string | null,
    checkinCount: r.checkin_count as number,
    lastCheckin: r.last_checkin as string | null,
  }));
}

export async function getRecentWorkoutsAll(limit: number) {
  const rows = await sql()`
    SELECT w.*, p.full_name FROM workout_log w
    LEFT JOIN profiles p ON w.email = p.email
    ORDER BY w.completed_at DESC
    LIMIT ${limit}
  `;
  return rows.map(r => ({
    ...toWorkoutObj(r),
    email: r.email as string,
    clientName: (r.full_name as string) || "",
  }));
}

