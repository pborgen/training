/* Execute Workout page logic */

declare global {
  interface Window { TrainingAuth: any; TrainingAPI: any; }
}

interface RoutineExercise { exerciseId: string; sets: number; reps: number; weightKg: number; }
interface Routine { id: string; name: string; exercises: RoutineExercise[]; }
interface SetLog { setNumber: number; repsCompleted: number; weightUsedKg: number; }
interface ExerciseLog { exerciseId: string; exerciseName: string; targetSets: number; targetReps: number; setsCompleted: SetLog[]; }

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const SESSION_KEY = "training_active_workout";

try { window.TrainingAuth.requireAuth(); } catch { throw new Error("redirecting"); }

let units = "lbs";
let routines: Routine[] = [];
let exerciseNames: Record<string, string> = {};

/* Workout state */
let workoutState: {
  routineId: string;
  routineName: string;
  startedAt: string;
  currentIndex: number;
  exerciseLogs: ExerciseLog[];
} | null = null;

function setStatus(text: string) { el("workoutStatus").textContent = text; }

/* ── Load data ── */
async function loadUnits() {
  try {
    const p = await window.TrainingAPI.get("/api/profile") as Record<string, any>;
    if (p.units) units = p.units;
  } catch { /* default lbs */ }
}

async function loadExerciseNames() {
  try {
    const [catalog, userEx] = await Promise.all([
      window.TrainingAPI.get("/api/exercises") as Promise<any[]>,
      window.TrainingAPI.get("/api/user-exercises") as Promise<any[]>,
    ]);
    [...catalog, ...userEx].forEach((ex: any) => { exerciseNames[ex.id] = ex.name; });
  } catch { /* best effort */ }
}

async function loadRoutines() {
  const select = el<HTMLSelectElement>("routineSelect");
  try {
    routines = await window.TrainingAPI.get("/api/routines") as Routine[];
    routines.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = `${r.name} (${Array.isArray(r.exercises) ? r.exercises.length : 0} exercises)`;
      select.appendChild(opt);
    });
  } catch {
    el("selectStatus").textContent = "Failed to load routines.";
  }
}

/* ── Session persistence ── */
function saveSession() {
  if (workoutState) sessionStorage.setItem(SESSION_KEY, JSON.stringify(workoutState));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function restoreSession(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    workoutState = JSON.parse(raw);
    return workoutState !== null;
  } catch { return false; }
}

/* ── Render current exercise ── */
function renderCurrentExercise() {
  if (!workoutState) return;

  const logs = workoutState.exerciseLogs;
  const idx = workoutState.currentIndex;
  const total = logs.length;

  el("exerciseProgress").textContent = `${idx + 1} of ${total}`;
  el("routineTitle").textContent = workoutState.routineName;

  if (idx >= total) {
    /* All exercises done — show finish */
    el("currentExercise").style.display = "none";
    el("logNextBtn").style.display = "none";
    el("upcomingSection").style.display = "none";
    el("finishSection").style.display = "";
    el("exerciseProgress").textContent = "All done!";
    return;
  }

  el("currentExercise").style.display = "";
  el("logNextBtn").style.display = "";
  el("finishSection").style.display = "";

  const current = logs[idx];
  el("currentExName").textContent = current.exerciseName;
  el("currentExTarget").textContent = `Target: ${current.targetSets} sets × ${current.targetReps} reps`;

  /* Build set input rows */
  const container = el("setsContainer");
  container.innerHTML = "";

  for (let s = 0; s < current.targetSets; s++) {
    const existing = current.setsCompleted[s];
    const row = document.createElement("div");
    row.className = "set-row";
    row.innerHTML =
      `<span class="hint">Set ${s + 1}</span>` +
      `<input type="number" class="set-reps" data-set="${s}" placeholder="Reps" min="0" value="${existing ? existing.repsCompleted : current.targetReps}" />` +
      `<input type="number" class="set-weight" data-set="${s}" placeholder="${units}" min="0" value="${existing ? existing.weightUsedKg : ""}" />`;
    container.appendChild(row);
  }

  /* Upcoming */
  const upList = el("upcomingList");
  upList.innerHTML = "";
  for (let i = idx + 1; i < total; i++) {
    const up = logs[i];
    const div = document.createElement("div");
    div.className = "row-card";
    div.innerHTML = `<span>${up.exerciseName}</span><span class="hint" style="margin-left:8px">${up.targetSets}×${up.targetReps}</span>`;
    upList.appendChild(div);
  }
  el("upcomingSection").style.display = idx + 1 < total ? "" : "none";
}

/* ── Start workout ── */
el("startWorkoutBtn").addEventListener("click", () => {
  const routineId = el<HTMLSelectElement>("routineSelect").value;
  if (!routineId) return (el("selectStatus").textContent = "Select a routine first.");

  const routine = routines.find(r => r.id === routineId);
  if (!routine || !Array.isArray(routine.exercises) || !routine.exercises.length) {
    return (el("selectStatus").textContent = "This routine has no exercises.");
  }

  workoutState = {
    routineId: routine.id,
    routineName: routine.name,
    startedAt: new Date().toISOString(),
    currentIndex: 0,
    exerciseLogs: routine.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      exerciseName: exerciseNames[ex.exerciseId] || ex.exerciseId,
      targetSets: ex.sets,
      targetReps: ex.reps,
      setsCompleted: [],
    })),
  };

  saveSession();
  showWorkoutUI();
  renderCurrentExercise();
});

/* ── Log current exercise & advance ── */
el("logNextBtn").addEventListener("click", () => {
  if (!workoutState) return;
  const idx = workoutState.currentIndex;
  if (idx >= workoutState.exerciseLogs.length) return;

  const current = workoutState.exerciseLogs[idx];
  const repsInputs = el("setsContainer").querySelectorAll<HTMLInputElement>(".set-reps");
  const weightInputs = el("setsContainer").querySelectorAll<HTMLInputElement>(".set-weight");

  const sets: SetLog[] = [];
  repsInputs.forEach((inp, i) => {
    sets.push({
      setNumber: i + 1,
      repsCompleted: Number(inp.value) || 0,
      weightUsedKg: Number(weightInputs[i]?.value) || 0,
    });
  });

  current.setsCompleted = sets;
  workoutState.currentIndex++;
  saveSession();
  renderCurrentExercise();
});

/* ── Finish workout ── */
el("finishWorkoutBtn").addEventListener("click", async () => {
  if (!workoutState) return;

  const payload = {
    routineId: workoutState.routineId,
    routineName: workoutState.routineName,
    startedAt: workoutState.startedAt,
    completedAt: new Date().toISOString(),
    exercises: workoutState.exerciseLogs.map(ex => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      setsCompleted: ex.setsCompleted,
    })),
  };

  try {
    await window.TrainingAPI.post("/api/workout-log", payload);
    clearSession();
    showSummary(payload);
  } catch {
    setStatus("Failed to save workout. Try again.");
  }
});

/* ── UI helpers ── */
function showWorkoutUI() {
  el("routineSelectSection").style.display = "none";
  el("workoutSection").style.display = "";
}

function showSummary(data: any) {
  el("workoutSection").style.display = "none";
  el("finishSection").style.display = "none";
  el("summarySection").style.display = "";

  let totalSets = 0;
  let totalVolume = 0;
  const lines: string[] = [];

  if (Array.isArray(data.exercises)) {
    data.exercises.forEach((ex: any) => {
      const sets = Array.isArray(ex.setsCompleted) ? ex.setsCompleted : [];
      totalSets += sets.length;
      let exVol = 0;
      sets.forEach((s: any) => { exVol += (s.repsCompleted || 0) * (s.weightUsedKg || 0); });
      totalVolume += exVol;
      lines.push(`<div class="row-card"><strong>${ex.exerciseName}</strong><span class="hint" style="display:block;margin-top:2px">${sets.length} sets · ${exVol.toLocaleString()} ${units} volume</span></div>`);
    });
  }

  el("summaryContent").innerHTML =
    `<p style="margin-bottom:12px"><strong>${data.exercises?.length || 0}</strong> exercises · <strong>${totalSets}</strong> sets · <strong>${totalVolume.toLocaleString()}</strong> ${units} total volume</p>` +
    lines.join("");
}

/* ── Init ── */
(async () => {
  await loadUnits();
  await loadExerciseNames();

  /* Restore an in-progress workout if exists */
  if (restoreSession() && workoutState) {
    showWorkoutUI();
    renderCurrentExercise();
  } else {
    await loadRoutines();
  }
})();
