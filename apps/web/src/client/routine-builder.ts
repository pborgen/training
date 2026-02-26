/* Routine builder page logic */

declare global {
  interface Window { TrainingAuth: any; TrainingAPI: any; }
}

interface AnyExercise { id: string; name: string; muscleGroup: string; defaultSets: number; defaultReps: number; defaultWeightKg?: number; defaultWeight?: number; }
interface RoutineExercise { exerciseId: string; exerciseName: string; sets: number; reps: number; weightKg: number; }

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

try { window.TrainingAuth.requireAuth(); } catch { throw new Error("redirecting"); }

let allExercises: AnyExercise[] = [];
let routineExercises: RoutineExercise[] = [];
let editId: string | null = null;
let units = "lbs";

function setStatus(text: string) { el("status").textContent = text; }

/* Check if editing existing routine via ?id= */
const params = new URLSearchParams(window.location.search);
editId = params.get("id");
if (editId) el("pageTitle").textContent = "Edit Routine";

/* Load exercises from catalog + user exercises, populate dropdown */
async function loadExercises() {
  try {
    const [catalog, userEx] = await Promise.all([
      window.TrainingAPI.get("/api/exercises") as Promise<AnyExercise[]>,
      window.TrainingAPI.get("/api/user-exercises") as Promise<AnyExercise[]>,
    ]);
    allExercises = [...catalog, ...userEx];

    const select = el<HTMLSelectElement>("exerciseSelect");
    // Clear existing options except the first placeholder
    while (select.options.length > 1) select.remove(1);

    // Catalog group
    if (catalog.length) {
      const grp1 = document.createElement("optgroup");
      grp1.label = "Exercise Catalog";
      catalog.forEach(ex => {
        const opt = document.createElement("option");
        opt.value = ex.id;
        opt.textContent = `${ex.name} (${ex.muscleGroup})`;
        grp1.appendChild(opt);
      });
      select.appendChild(grp1);
    }

    // User exercises group
    if (userEx.length) {
      const grp2 = document.createElement("optgroup");
      grp2.label = "My Exercises";
      userEx.forEach(ex => {
        const opt = document.createElement("option");
        opt.value = ex.id;
        opt.textContent = `${ex.name} (${ex.muscleGroup})`;
        grp2.appendChild(opt);
      });
      select.appendChild(grp2);
    }
  } catch {
    setStatus("Failed to load exercises.");
  }
}

/* Auto-fill defaults when exercise selected */
el("exerciseSelect").addEventListener("change", () => {
  const id = el<HTMLSelectElement>("exerciseSelect").value;
  const ex = allExercises.find(e => e.id === id);
  if (!ex) return;
  el<HTMLInputElement>("exSets").value = String(ex.defaultSets || "");
  el<HTMLInputElement>("exReps").value = String(ex.defaultReps || "");
  el<HTMLInputElement>("exWeight").value = String(ex.defaultWeightKg ?? ex.defaultWeight ?? "");
});

/* Render current routine exercises list */
function renderRoutineExercises() {
  const container = el("routineExercises");
  el("emptyMsg").style.display = routineExercises.length ? "none" : "block";
  container.innerHTML = "";

  routineExercises.forEach((re, idx) => {
    const card = document.createElement("div");
    card.className = "row-card";
    card.style.display = "flex";
    card.style.justifyContent = "space-between";
    card.style.alignItems = "center";
    card.innerHTML =
      `<div>` +
      `<strong>${re.exerciseName}</strong>` +
      `<span class="hint" style="display:block;margin-top:2px">${re.sets}&times;${re.reps} @ ${re.weightKg} ${units}</span>` +
      `</div>` +
      `<button class="btn-delete" data-idx="${idx}">Remove</button>`;
    container.appendChild(card);
  });

  container.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number((btn as HTMLElement).dataset.idx);
      routineExercises.splice(idx, 1);
      renderRoutineExercises();
    });
  });
}

/* Add exercise to routine */
el("addToRoutineBtn").addEventListener("click", () => {
  const exerciseId = el<HTMLSelectElement>("exerciseSelect").value;
  if (!exerciseId) return setStatus("Select an exercise first.");
  const ex = allExercises.find(e => e.id === exerciseId);
  if (!ex) return;

  const sets = Number(el<HTMLInputElement>("exSets").value) || 0;
  const reps = Number(el<HTMLInputElement>("exReps").value) || 0;
  const weightKg = Number(el<HTMLInputElement>("exWeight").value) || 0;

  if (!sets || !reps) return setStatus("Enter sets and reps.");

  routineExercises.push({ exerciseId, exerciseName: ex.name, sets, reps, weightKg });
  renderRoutineExercises();

  // Reset inputs
  el<HTMLSelectElement>("exerciseSelect").value = "";
  el<HTMLInputElement>("exSets").value = "";
  el<HTMLInputElement>("exReps").value = "";
  el<HTMLInputElement>("exWeight").value = "";
  setStatus("");
});

/* Save routine */
el("saveRoutineBtn").addEventListener("click", async () => {
  const name = el<HTMLInputElement>("routineName").value.trim();
  const goal = el<HTMLSelectElement>("routineGoal").value;
  const daysPerWeek = Number(el<HTMLInputElement>("daysPerWeek").value) || 0;

  if (!name) return setStatus("Enter a routine name.");
  if (!routineExercises.length) return setStatus("Add at least one exercise.");

  const payload = {
    name,
    goal,
    daysPerWeek,
    exercises: routineExercises.map(re => ({ exerciseId: re.exerciseId, sets: re.sets, reps: re.reps, weightKg: re.weightKg })),
  };

  try {
    if (editId) {
      await window.TrainingAPI.put(`/api/routines/${editId}`, payload);
    } else {
      await window.TrainingAPI.post("/api/routines", payload);
    }
    window.location.href = "/dashboard.html";
  } catch {
    setStatus("Failed to save routine.");
  }
});

/* Load existing routine if editing */
async function loadRoutine() {
  if (!editId) return;
  try {
    const r = await window.TrainingAPI.get(`/api/routines/${editId}`) as any;
    el<HTMLInputElement>("routineName").value = r.name || "";
    el<HTMLSelectElement>("routineGoal").value = r.goal || "";
    el<HTMLInputElement>("daysPerWeek").value = String(r.daysPerWeek || "");

    // Map routine exercises, resolving names
    if (Array.isArray(r.exercises)) {
      routineExercises = r.exercises.map((re: any) => {
        const ex = allExercises.find(e => e.id === re.exerciseId);
        return {
          exerciseId: re.exerciseId,
          exerciseName: ex?.name || re.exerciseId,
          sets: re.sets || 0,
          reps: re.reps || 0,
          weightKg: re.weightKg || 0,
        };
      });
      renderRoutineExercises();
    }
  } catch {
    setStatus("Failed to load routine.");
  }
}

async function loadUnits() {
  try {
    const p = await window.TrainingAPI.get("/api/profile") as Record<string, any>;
    if (p.units) units = p.units;
    el<HTMLInputElement>("exWeight").placeholder = `Weight (${units})`;
  } catch { /* no profile */ }
}

/* Init */
(async () => {
  await loadUnits();
  await loadExercises();
  await loadRoutine();
})();
