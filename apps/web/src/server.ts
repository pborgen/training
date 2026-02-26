import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { OAuth2Client } from "google-auth-library";

const app = express();
const port = Number(process.env.PORT || 8080);
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const allowDevAuthHeaders = process.env.ALLOW_DEV_AUTH_HEADERS === "true";
const verifier = new OAuth2Client(googleClientId || undefined);

const root = process.cwd();
const usersDir = path.join(root, "data", "users");

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(root));

/* ── Helpers ────────────────────────────────── */

function safeId(email: string) {
  return (email || "unknown").toLowerCase().replace(/[^a-z0-9._-]/g, "_");
}

function uuid() { return crypto.randomUUID(); }

interface UserData {
  user: string;
  syncedAt: string | null;
  profile: Record<string, unknown> | null;
  exercises: Record<string, unknown>[];
  routines: Record<string, unknown>[];
  workoutLog: Record<string, unknown>[];
  rows: Record<string, string>[];
}

async function loadUserData(email: string): Promise<UserData> {
  await fs.mkdir(usersDir, { recursive: true });
  const file = path.join(usersDir, `${safeId(email)}.json`);
  try {
    const raw = await fs.readFile(file, "utf8");
    const data = JSON.parse(raw);
    return {
      user: email,
      syncedAt: data.syncedAt ?? null,
      profile: data.profile ?? null,
      exercises: Array.isArray(data.exercises) ? data.exercises : [],
      routines: Array.isArray(data.routines) ? data.routines : [],
      workoutLog: Array.isArray(data.workoutLog) ? data.workoutLog : [],
      rows: Array.isArray(data.rows) ? data.rows : [],
    };
  } catch {
    return { user: email, syncedAt: null, profile: null, exercises: [], routines: [], workoutLog: [], rows: [] };
  }
}

async function saveUserData(email: string, data: UserData): Promise<void> {
  await fs.mkdir(usersDir, { recursive: true });
  data.syncedAt = new Date().toISOString();
  const file = path.join(usersDir, `${safeId(email)}.json`);
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function identifyUser(req: express.Request): Promise<string | null> {
  const auth = req.header("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length);
    if (!googleClientId) return null;
    const ticket = await verifier.verifyIdToken({ idToken: token, audience: googleClientId });
    const payload = ticket.getPayload();
    return payload?.email || null;
  }
  if (allowDevAuthHeaders) {
    const devEmail = req.header("x-user-email");
    if (devEmail) return devEmail;
  }
  return null;
}

async function requireUser(req: express.Request, res: express.Response): Promise<string | null> {
  try {
    const email = await identifyUser(req);
    if (!email) { res.status(401).json({ error: "Unauthorized" }); return null; }
    return email;
  } catch {
    res.status(401).json({ error: "Unauthorized" }); return null;
  }
}

/* ── Public endpoints ───────────────────────── */

app.get("/hello", (_req, res) => {
  res.type("text/plain").send("hello from training app");
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/exercises", async (_req, res) => {
  try {
    const filePath = path.join(root, "data", "exercises.json");
    const raw = await fs.readFile(filePath, "utf8");
    res.json(JSON.parse(raw));
  } catch {
    res.status(500).json({ error: "Failed to load exercise catalog" });
  }
});

/* ── Auth endpoints ─────────────────────────── */

app.get("/api/session", async (req, res) => {
  const email = await identifyUser(req);
  if (!email) return res.status(401).json({ ok: false, authenticated: false });
  return res.json({ ok: true, authenticated: true, email });
});

/* ── Sync (legacy + expanded) ───────────────── */

app.get("/api/sync", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/sync", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    if (Array.isArray(req.body?.rows)) data.rows = req.body.rows;
    if (req.body?.profile) data.profile = req.body.profile;
    if (Array.isArray(req.body?.exercises)) data.exercises = req.body.exercises;
    if (Array.isArray(req.body?.routines)) data.routines = req.body.routines;
    if (Array.isArray(req.body?.workoutLog)) data.workoutLog = req.body.workoutLog;
    await saveUserData(email, data);
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── Profile ────────────────────────────────── */

app.get("/api/profile", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    res.json(data.profile || {});
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/profile", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    data.profile = req.body;
    await saveUserData(email, data);
    res.json({ ok: true, profile: data.profile });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── User Exercises ─────────────────────────── */

app.get("/api/user-exercises", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    res.json(data.exercises);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/user-exercises", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    const exercise = { ...req.body, id: req.body.id || uuid(), createdAt: new Date().toISOString() };
    data.exercises.push(exercise);
    await saveUserData(email, data);
    res.json({ ok: true, exercise });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/user-exercises/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    const idx = data.exercises.findIndex((e: any) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Exercise not found" });
    data.exercises[idx] = { ...data.exercises[idx], ...req.body, id: req.params.id };
    await saveUserData(email, data);
    res.json({ ok: true, exercise: data.exercises[idx] });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete("/api/user-exercises/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    data.exercises = data.exercises.filter((e: any) => e.id !== req.params.id);
    await saveUserData(email, data);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── Routines ───────────────────────────────── */

app.get("/api/routines", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    res.json(data.routines);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/routines/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    const routine = data.routines.find((r: any) => r.id === req.params.id);
    if (!routine) return res.status(404).json({ error: "Routine not found" });
    res.json(routine);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/routines", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    const now = new Date().toISOString();
    const routine = { ...req.body, id: req.body.id || uuid(), createdAt: now, updatedAt: now };
    data.routines.push(routine);
    await saveUserData(email, data);
    res.json({ ok: true, routine });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/routines/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    const idx = data.routines.findIndex((r: any) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Routine not found" });
    data.routines[idx] = { ...data.routines[idx], ...req.body, id: req.params.id, updatedAt: new Date().toISOString() };
    await saveUserData(email, data);
    res.json({ ok: true, routine: data.routines[idx] });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete("/api/routines/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    data.routines = data.routines.filter((r: any) => r.id !== req.params.id);
    await saveUserData(email, data);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── Workout Log ────────────────────────────── */

app.get("/api/workout-log", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    const limit = Number(req.query.limit) || 0;
    const logs = limit > 0 ? data.workoutLog.slice(-limit) : data.workoutLog;
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/workout-log", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    const entry = { ...req.body, id: req.body.id || uuid() };
    data.workoutLog.push(entry);
    await saveUserData(email, data);
    res.json({ ok: true, entry });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/workout-log/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const data = await loadUserData(email);
    const entry = data.workoutLog.find((e: any) => e.id === req.params.id);
    if (!entry) return res.status(404).json({ error: "Log entry not found" });
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── Start ──────────────────────────────────── */

app.listen(port, () => {
  console.log(`Training app running on http://localhost:${port}`);
});
