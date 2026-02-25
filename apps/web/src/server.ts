import fs from "node:fs/promises";
import path from "node:path";
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

function safeId(email: string) {
  return (email || "unknown").toLowerCase().replace(/[^a-z0-9._-]/g, "_");
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

app.get("/hello", (_req, res) => {
  res.type("text/plain").send("hello from training app");
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/session", async (req, res) => {
  const email = await identifyUser(req);
  if (!email) return res.status(401).json({ ok: false, authenticated: false });
  return res.json({ ok: true, authenticated: true, email });
});

app.get("/api/sync", async (req, res) => {
  try {
    const email = await identifyUser(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    await fs.mkdir(usersDir, { recursive: true });
    const file = path.join(usersDir, `${safeId(email)}.json`);
    try {
      const raw = await fs.readFile(file, "utf8");
      return res.json(JSON.parse(raw));
    } catch {
      return res.json({ rows: [], syncedAt: null, user: email });
    }
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
});

app.post("/api/sync", async (req, res) => {
  try {
    const email = await identifyUser(req);
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    const payload = {
      rows: Array.isArray(req.body?.rows) ? req.body.rows : [],
      syncedAt: new Date().toISOString(),
      user: email
    };

    await fs.mkdir(usersDir, { recursive: true });
    const file = path.join(usersDir, `${safeId(email)}.json`);
    await fs.writeFile(file, JSON.stringify(payload, null, 2));

    res.json({ ok: true, ...payload });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.listen(port, () => {
  console.log(`Training app running on http://localhost:${port}`);
});
