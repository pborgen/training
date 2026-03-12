import type {
  UserProfile,
  Exercise,
  UserExercise,
  Routine,
  WorkoutLogEntry,
} from "./types";

const AUTH_KEY = "training_app_auth_v1";

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      const auth = JSON.parse(raw);
      if (auth?.idToken) h["Authorization"] = `Bearer ${auth.idToken}`;
    }
  } catch { /* no auth */ }
  return h;
}

async function apiFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// Profile
export const fetchProfile = () => apiFetch<UserProfile>("GET", "/api/profile");
export const saveProfile = (p: UserProfile) => apiFetch<{ ok: boolean; profile: UserProfile }>("PUT", "/api/profile", p);

// Exercises
export const fetchExercises = () => apiFetch<Exercise[]>("GET", "/api/exercises");
export const fetchUserExercises = () => apiFetch<UserExercise[]>("GET", "/api/user-exercises");
export const createUserExercise = (ex: Partial<UserExercise>) => apiFetch<{ ok: boolean; exercise: UserExercise }>("POST", "/api/user-exercises", ex);
export const updateUserExercise = (id: string, ex: Partial<UserExercise>) => apiFetch<{ ok: boolean; exercise: UserExercise }>("PUT", `/api/user-exercises/${id}`, ex);
export const deleteUserExercise = (id: string) => apiFetch<{ ok: boolean }>("DELETE", `/api/user-exercises/${id}`);

// Routines
export const fetchRoutines = () => apiFetch<Routine[]>("GET", "/api/routines");
export const fetchRoutine = (id: string) => apiFetch<Routine>("GET", `/api/routines/${id}`);
export const createRoutine = (r: Partial<Routine>) => apiFetch<{ ok: boolean; routine: Routine }>("POST", "/api/routines", r);
export const updateRoutine = (id: string, r: Partial<Routine>) => apiFetch<{ ok: boolean; routine: Routine }>("PUT", `/api/routines/${id}`, r);
export const deleteRoutine = (id: string) => apiFetch<{ ok: boolean }>("DELETE", `/api/routines/${id}`);

// Workout Log
export const fetchWorkoutLog = (limit = 0) => apiFetch<WorkoutLogEntry[]>("GET", limit ? `/api/workout-log?limit=${limit}` : "/api/workout-log");
export const saveWorkoutLog = (entry: Omit<WorkoutLogEntry, "id">) => apiFetch<{ ok: boolean; entry: WorkoutLogEntry }>("POST", "/api/workout-log", entry);

// Session
export const checkSession = () => apiFetch<{ authenticated: boolean; email?: string }>("GET", "/api/session");
