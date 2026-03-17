import path from "node:path";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { OAuth2Client } from "google-auth-library";
import {
  ensureTables, seedExercises, ensureProfile,
  getProfile, upsertProfile, updateProfilePhoto,
  getCatalogExercises,
  getUserExercises, createUserExercise, updateUserExercise, deleteUserExercise,
  getRoutines, getRoutine, createRoutine, updateRoutine, deleteRoutine,
  getWorkoutLog, createWorkoutLog, getWorkoutLogEntry,
  getReadinessCheckins, createReadinessCheckin, deleteReadinessCheckin,
  getUserByUsername, seedDevUsers, getUserRole, getAllUsers, ensureGoogleUser,
  getAllLabels, createLabel, updateLabel, deleteLabel, getLabelsForAllUsers, setUserLabels,
  getScheduledWorkouts, getScheduledWorkoutsForAll, createScheduledWorkout, deleteScheduledWorkout,
  getAllRoutinesAdmin, seedDevRoutines, getSetting, setSetting,
  ensureRagTables, getKnowledgeChunkCount, saveChatMessage, getChatHistory,
} from "./db.js";
import { seedKnowledgeBase } from "./rag/embeddings.js";
import { retrieveRelevantChunks } from "./rag/retrieval.js";
import { generateAnswer } from "./rag/generation.js";

export const app = express();
const port = Number(process.env.PORT || 8080);
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const allowDevAuthHeaders = process.env.ALLOW_DEV_AUTH_HEADERS === "true";
const verifier = new OAuth2Client(googleClientId || undefined);

const root = process.cwd();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const clientDir = path.join(root, "dist", "client");
app.use(express.static(clientDir));

/* ── Helpers ────────────────────────────────── */

function uuid() { return crypto.randomUUID(); }

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
    await ensureProfile(email);
    return email;
  } catch {
    res.status(401).json({ error: "Unauthorized" }); return null;
  }
}

/* ── Dev mode accounts ─────────────────────── */

const DEV_ACCOUNTS = [
  { email: "admin@dev.local", name: "Admin", role: "admin" },
  { email: "paul@dev.local", name: "Paul", role: "client" },
  { email: "diego@dev.local", name: "Diego", role: "client" },
];

app.get("/api/dev/accounts", (_req, res) => {
  if (!allowDevAuthHeaders) return res.status(404).json({ error: "Not found" });
  res.json(DEV_ACCOUNTS);
});

/* ── Username/Password login ─────────────────── */

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    const user = await getUserByUsername(username);
    if (!user) return res.status(401).json({ error: "Invalid username or password" });
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    if (hash !== user.passwordHash) return res.status(401).json({ error: "Invalid username or password" });
    res.json({ ok: true, email: user.email, role: user.role, username: user.username });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── Admin endpoints ──────────────────────── */

async function requireAdmin(req: express.Request, res: express.Response): Promise<string | null> {
  const email = await requireUser(req, res);
  if (!email) return null;
  const role = await getUserRole(email);
  if (role !== "admin") { res.status(403).json({ error: "Forbidden" }); return null; }
  return email;
}

app.get("/api/admin/users", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    res.json(await getAllUsers());
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── Labels (admin) ──────────────────────── */

app.get("/api/admin/labels", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    res.json(await getAllLabels());
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/admin/labels", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { name, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const id = crypto.randomUUID();
    const label = await createLabel(id, name.trim(), color || "#00c896");
    res.json({ ok: true, label });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/admin/labels/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { name, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const label = await updateLabel(req.params.id, name.trim(), color || "#00c896");
    if (!label) return res.status(404).json({ error: "Label not found" });
    res.json({ ok: true, label });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete("/api/admin/labels/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    await deleteLabel(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/admin/user-labels", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    res.json(await getLabelsForAllUsers());
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/admin/users/:email/labels", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { labelIds } = req.body;
    if (!Array.isArray(labelIds)) return res.status(400).json({ error: "labelIds array required" });
    await setUserLabels(decodeURIComponent(req.params.email), labelIds);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── Scheduled Workouts (admin) ────────────── */

app.get("/api/admin/scheduled-workouts", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const from = (req.query.from as string) || "2000-01-01";
    const to = (req.query.to as string) || "2099-12-31";
    res.json(await getScheduledWorkoutsForAll(from, to));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/admin/scheduled-workouts", async (req, res) => {
  try {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const { clientEmail, routineId, routineName, scheduledDate, notes } = req.body;
    if (!clientEmail || !routineId || !routineName || !scheduledDate) {
      return res.status(400).json({ error: "clientEmail, routineId, routineName, and scheduledDate are required" });
    }
    const id = crypto.randomUUID();
    const entry = await createScheduledWorkout(id, { clientEmail, routineId, routineName, scheduledDate, notes, createdBy: adminEmail });
    res.json({ ok: true, entry });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete("/api/admin/scheduled-workouts/:id", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    await deleteScheduledWorkout(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/admin/routines", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    res.json(await getAllRoutinesAdmin());
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── App Settings (admin) ─────────────────── */

app.get("/api/admin/settings/:key", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const value = await getSetting(req.params.key);
    res.json({ key: req.params.key, value });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/admin/settings/:key", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const { value } = req.body;
    if (value == null) return res.status(400).json({ error: "value required" });
    await setSetting(req.params.key, String(value));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── Scheduled Workouts (client) ──────────── */

app.get("/api/settings/client-permissions", async (req, res) => {
  try {
    const selfSchedule = await getSetting("client_self_schedule");
    res.json({ clientSelfSchedule: selfSchedule !== "false" });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/my-schedule", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const from = (req.query.from as string) || "2000-01-01";
    const to = (req.query.to as string) || "2099-12-31";
    res.json(await getScheduledWorkouts(email, from, to));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/my-schedule", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const selfSchedule = await getSetting("client_self_schedule");
    if (selfSchedule === "false") return res.status(403).json({ error: "Self-scheduling is disabled by your admin" });
    const { routineId, routineName, scheduledDate, notes } = req.body;
    if (!routineId || !routineName || !scheduledDate) {
      return res.status(400).json({ error: "routineId, routineName, and scheduledDate are required" });
    }
    const id = crypto.randomUUID();
    const entry = await createScheduledWorkout(id, { clientEmail: email, routineId, routineName, scheduledDate, notes, createdBy: email });
    res.json({ ok: true, entry });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete("/api/my-schedule/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const selfSchedule = await getSetting("client_self_schedule");
    if (selfSchedule === "false") return res.status(403).json({ error: "Self-scheduling is disabled by your admin" });
    await deleteScheduledWorkout(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── Google auth ────────────────────────────── */

app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "Missing credential" });
    if (!googleClientId) return res.status(500).json({ error: "Google auth not configured" });
    const ticket = await verifier.verifyIdToken({ idToken: credential, audience: googleClientId });
    const payload = ticket.getPayload();
    const email = payload?.email;
    if (!email) return res.status(401).json({ error: "No email in token" });
    await ensureGoogleUser(email, payload?.name);
    const role = await getUserRole(email);
    res.json({ ok: true, email, role });
  } catch (e) {
    res.status(401).json({ error: "Invalid Google token" });
  }
});

/* ── Auth config ────────────────────────────── */

app.get("/api/auth/config", (_req, res) => {
  res.json({ googleClientId: googleClientId || null });
});

/* ── Public endpoints ───────────────────────── */

app.get("/hello", (_req, res) => {
  res.type("text/plain").send("hello from training app");
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/exercises", async (_req, res) => {
  try {
    res.json(await getCatalogExercises());
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── Auth endpoints ─────────────────────────── */

app.get("/api/session", async (req, res) => {
  const email = await identifyUser(req);
  if (!email) return res.status(401).json({ ok: false, authenticated: false });
  return res.json({ ok: true, authenticated: true, email });
});

/* ── Profile ────────────────────────────────── */

app.get("/api/profile", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    res.json(await getProfile(email));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/profile", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    await upsertProfile(email, req.body);
    res.json({ ok: true, profile: await getProfile(email) });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/profile/photo", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const { photoUrl } = req.body;
    if (!photoUrl || typeof photoUrl !== "string") {
      return res.status(400).json({ error: "photoUrl is required" });
    }
    if (!photoUrl.startsWith("data:image/")) {
      return res.status(400).json({ error: "Only data URL images are accepted" });
    }
    // Limit to ~2MB base64
    if (photoUrl.length > 2_800_000) {
      return res.status(413).json({ error: "Image too large (max ~2MB)" });
    }
    await updateProfilePhoto(email, photoUrl);
    res.json({ ok: true, photoUrl });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── User Exercises ─────────────────────────── */

app.get("/api/user-exercises", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    res.json(await getUserExercises(email));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/user-exercises", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const id = req.body.id || uuid();
    const exercise = await createUserExercise(email, req.body, id);
    res.json({ ok: true, exercise });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/user-exercises/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const exercise = await updateUserExercise(email, req.params.id, req.body);
    if (!exercise) return res.status(404).json({ error: "Exercise not found" });
    res.json({ ok: true, exercise });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete("/api/user-exercises/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    await deleteUserExercise(email, req.params.id);
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
    res.json(await getRoutines(email));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/routines/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const routine = await getRoutine(email, req.params.id);
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
    const id = req.body.id || uuid();
    const routine = await createRoutine(email, req.body, id);
    res.json({ ok: true, routine });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put("/api/routines/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const routine = await updateRoutine(email, req.params.id, req.body);
    if (!routine) return res.status(404).json({ error: "Routine not found" });
    res.json({ ok: true, routine });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete("/api/routines/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    await deleteRoutine(email, req.params.id);
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
    const limit = Number(req.query.limit) || 0;
    res.json(await getWorkoutLog(email, limit));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/workout-log", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const id = req.body.id || uuid();
    const entry = await createWorkoutLog(email, req.body, id);
    res.json({ ok: true, entry });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/workout-log/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const entry = await getWorkoutLogEntry(email, req.params.id);
    if (!entry) return res.status(404).json({ error: "Log entry not found" });
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── Readiness Check-ins ───────────────────── */

app.get("/api/readiness", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const limit = Number(req.query.limit) || 0;
    res.json(await getReadinessCheckins(email, limit));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/readiness", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const id = req.body.id || uuid();
    const checkin = await createReadinessCheckin(email, req.body, id);
    res.json({ ok: true, checkin });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete("/api/readiness/:id", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    await deleteReadinessCheckin(email, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── RAG Exercise Coach ────────────────────── */

app.get("/api/rag/status", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const chunkCount = await getKnowledgeChunkCount();
    res.json({ seeded: chunkCount > 0, chunkCount });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/rag/seed", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    console.log("Seeding RAG knowledge base...");
    const result = await seedKnowledgeBase();
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/rag/chat", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    const { message, sessionId: existingSessionId } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message required" });

    const sessionId = existingSessionId || uuid();

    // Load chat history for multi-turn context
    const history = existingSessionId
      ? (await getChatHistory(email, sessionId)).map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
      : [];

    // RAG pipeline: retrieve → generate
    const chunks = await retrieveRelevantChunks(message, 5);
    const { answer, sources } = await generateAnswer(message, chunks, history);

    // Save both messages to history
    await saveChatMessage(uuid(), email, sessionId, "user", message);
    await saveChatMessage(uuid(), email, sessionId, "assistant", answer, sources);

    res.json({ answer, sources, sessionId });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get("/api/rag/chat/:sessionId", async (req, res) => {
  try {
    const email = await requireUser(req, res);
    if (!email) return;
    res.json(await getChatHistory(email, req.params.sessionId));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

/* ── SPA Fallback ──────────────────────────── */

app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

/* ── Start ──────────────────────────────────── */

if (!process.env.VERCEL) {
  (async () => {
    await ensureTables();
    await ensureRagTables();
    await seedExercises();
    await seedDevUsers();
    await seedDevRoutines();
    app.listen(port, () => {
      console.log(`Training app running on http://localhost:${port}`);
    });
  })();
}
