import type {
  UserProfile,
  Exercise,
  UserExercise,
  Routine,
  WorkoutLogEntry,
  ReadinessCheckin,
  ScheduledWorkout,
  AdminRoutine,
} from "./types";

const AUTH_KEY = "training_app_auth_v1";

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      const auth = JSON.parse(raw);
      if (auth?.devMode) {
        h["x-user-email"] = auth.email;
      } else if (auth?.idToken) {
        h["Authorization"] = `Bearer ${auth.idToken}`;
      }
    }
  } catch { /* no auth */ }
  return h;
}

// Dev accounts
export interface DevAccount { email: string; name: string; role: string; }
export const fetchDevAccounts = () => fetch("/api/dev/accounts").then(r => r.ok ? r.json() as Promise<DevAccount[]> : null);

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
export const uploadProfilePhoto = (photoUrl: string) => apiFetch<{ ok: boolean; photoUrl: string }>("PUT", "/api/profile/photo", { photoUrl });

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

// Readiness Check-ins
export const fetchReadiness = (limit = 0) => apiFetch<ReadinessCheckin[]>("GET", limit ? `/api/readiness?limit=${limit}` : "/api/readiness");
export const saveReadiness = (c: Omit<ReadinessCheckin, "id" | "createdAt">) => apiFetch<{ ok: boolean; checkin: ReadinessCheckin }>("POST", "/api/readiness", c);
export const deleteReadiness = (id: string) => apiFetch<{ ok: boolean }>("DELETE", `/api/readiness/${id}`);

// Admin
export interface AdminUser { username: string; email: string; role: string; fullName: string; age: number; gender: string; createdAt: string; }
export const fetchAllUsers = () => apiFetch<AdminUser[]>("GET", "/api/admin/users");

// Labels
export interface Label { id: string; name: string; color: string; }
export const fetchLabels = () => apiFetch<Label[]>("GET", "/api/admin/labels");
export const createLabelApi = (name: string, color: string) => apiFetch<{ ok: boolean; label: Label }>("POST", "/api/admin/labels", { name, color });
export const updateLabelApi = (id: string, name: string, color: string) => apiFetch<{ ok: boolean; label: Label }>("PUT", `/api/admin/labels/${id}`, { name, color });
export const deleteLabelApi = (id: string) => apiFetch<{ ok: boolean }>("DELETE", `/api/admin/labels/${id}`);
export const fetchUserLabels = () => apiFetch<Record<string, Label[]>>("GET", "/api/admin/user-labels");
export const setUserLabelsApi = (email: string, labelIds: string[]) => apiFetch<{ ok: boolean }>("PUT", `/api/admin/users/${encodeURIComponent(email)}/labels`, { labelIds });

// Scheduled Workouts (admin)
export const fetchScheduledWorkoutsAdmin = (from: string, to: string) =>
  apiFetch<ScheduledWorkout[]>("GET", `/api/admin/scheduled-workouts?from=${from}&to=${to}`);
export const createScheduledWorkoutApi = (sw: { clientEmail: string; routineId: string; routineName: string; scheduledDate: string; notes?: string }) =>
  apiFetch<{ ok: boolean; entry: ScheduledWorkout }>("POST", "/api/admin/scheduled-workouts", sw);
export const deleteScheduledWorkoutApi = (id: string) =>
  apiFetch<{ ok: boolean }>("DELETE", `/api/admin/scheduled-workouts/${id}`);
export const fetchAllRoutinesAdmin = () => apiFetch<AdminRoutine[]>("GET", "/api/admin/routines");

// Scheduled Workouts (client)
export const fetchMySchedule = (from: string, to: string) =>
  apiFetch<ScheduledWorkout[]>("GET", `/api/my-schedule?from=${from}&to=${to}`);
export const createMySchedule = (sw: { routineId: string; routineName: string; scheduledDate: string; notes?: string }) =>
  apiFetch<{ ok: boolean; entry: ScheduledWorkout }>("POST", "/api/my-schedule", sw);
export const deleteMySchedule = (id: string) =>
  apiFetch<{ ok: boolean }>("DELETE", `/api/my-schedule/${id}`);

// Client permissions
export const fetchClientPermissions = () =>
  apiFetch<{ clientSelfSchedule: boolean }>("GET", "/api/settings/client-permissions");

// Admin settings
export const fetchAdminSetting = (key: string) =>
  apiFetch<{ key: string; value: string | null }>("GET", `/api/admin/settings/${key}`);
export const updateAdminSetting = (key: string, value: string) =>
  apiFetch<{ ok: boolean }>("PUT", `/api/admin/settings/${key}`, { value });

// Auth config
export const fetchAuthConfig = () => fetch("/api/auth/config").then(r => r.json() as Promise<{ googleClientId: string | null }>);

// Google auth
export const loginWithGoogle = (credential: string) =>
  fetch("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) })
    .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "Google login failed"); return data as { ok: boolean; email: string; role: string }; });

// RAG Coach
export interface RagChatResponse { answer: string; sources: { chunkId: string; exerciseId: string; chunkType: string; title: string; similarity: number }[]; sessionId: string; }
export interface RagMessage { id: string; role: string; content: string; sources: unknown[]; createdAt: string; }
export interface RagStatus { seeded: boolean; chunkCount: number; }
export const fetchRagStatus = () => apiFetch<RagStatus>("GET", "/api/rag/status");
export const sendRagMessage = (message: string, sessionId?: string) => apiFetch<RagChatResponse>("POST", "/api/rag/chat", { message, sessionId });
export const fetchRagChatHistory = (sessionId: string) => apiFetch<RagMessage[]>("GET", `/api/rag/chat/${sessionId}`);
export const triggerRagSeed = () => apiFetch<{ ok: boolean; chunksProcessed: number }>("POST", "/api/rag/seed");

// Session
export const checkSession = () => apiFetch<{ authenticated: boolean; email?: string }>("GET", "/api/session");

// Login
export const loginWithCredentials = (username: string, password: string) =>
  fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) })
    .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || "Login failed"); return data as { ok: boolean; email: string; role: string; username: string }; });
