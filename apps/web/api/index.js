import { ensureTables, seedExercises } from "../dist/db.js";
import { app, ensureRagTables } from "../dist/server.js";

let initialized = false;

async function init() {
  if (initialized) return;
  await ensureTables();
  await ensureRagTables();
  await seedExercises();
  initialized = true;
}

export default async function handler(req, res) {
  await init();
  return app(req, res);
}
