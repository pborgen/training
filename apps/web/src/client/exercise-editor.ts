/* Exercise editor page logic */

declare global {
  interface Window { TrainingAuth: any; TrainingAPI: any; }
}

interface UserExercise {
  id: string; name: string; type: string; muscleGroup: string;
  defaultSets: number; defaultReps: number; defaultWeightKg: number; createdAt: string;
}

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

try { window.TrainingAuth.requireAuth(); } catch { throw new Error("redirecting"); }

let exercises: UserExercise[] = [];
let units = "lbs";

function setStatus(text: string) { el("status").textContent = text; }

function toKebab(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function renderList() {
  const container = el("exerciseList");
  el("emptyMsg").style.display = exercises.length ? "none" : "block";
  container.innerHTML = "";

  exercises.forEach(ex => {
    const card = document.createElement("div");
    card.className = "row-card";
    card.innerHTML =
      `<strong>${ex.name}</strong>` +
      `<span class="hint" style="display:block;margin-top:2px">${ex.muscleGroup} &middot; ${ex.type} &middot; ${ex.defaultSets}&times;${ex.defaultReps} @ ${ex.defaultWeightKg} ${units}</span>` +
      `<div class="btn-row">` +
      `<button class="btn-edit" data-id="${ex.id}">Edit</button>` +
      `<button class="btn-delete" data-id="${ex.id}">Delete</button>` +
      `</div>`;
    container.appendChild(card);
  });

  container.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = (btn as HTMLElement).dataset.id!;
      if (!confirm("Delete this exercise?")) return;
      try {
        await window.TrainingAPI.del(`/api/user-exercises/${id}`);
        exercises = exercises.filter(e => e.id !== id);
        renderList();
      } catch { setStatus("Failed to delete."); }
    });
  });

  container.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = (btn as HTMLElement).dataset.id!;
      const ex = exercises.find(e => e.id === id);
      if (!ex) return;
      el<HTMLInputElement>("exerciseName").value = ex.name;
      el<HTMLSelectElement>("exerciseType").value = ex.type;
      el<HTMLSelectElement>("muscleGroup").value = ex.muscleGroup;
      el<HTMLInputElement>("defaultSets").value = String(ex.defaultSets);
      el<HTMLInputElement>("defaultReps").value = String(ex.defaultReps);
      el<HTMLInputElement>("defaultWeight").value = String(ex.defaultWeightKg);
      el<HTMLButtonElement>("addExerciseBtn").textContent = "Update Exercise";
      el<HTMLButtonElement>("addExerciseBtn").dataset.editId = id;
    });
  });
}

async function loadExercises() {
  try {
    exercises = await window.TrainingAPI.get("/api/user-exercises") as UserExercise[];
    renderList();
  } catch { setStatus("Failed to load exercises."); }
}

async function loadUnits() {
  try {
    const p = await window.TrainingAPI.get("/api/profile") as Record<string, any>;
    if (p.units) units = p.units;
    el<HTMLInputElement>("defaultWeight").placeholder = `Weight (${units})`;
  } catch { /* no profile yet */ }
}

el("addExerciseBtn").addEventListener("click", async () => {
  const name = el<HTMLInputElement>("exerciseName").value.trim();
  const type = el<HTMLSelectElement>("exerciseType").value;
  const muscleGroup = el<HTMLSelectElement>("muscleGroup").value;
  const defaultSets = Number(el<HTMLInputElement>("defaultSets").value) || 0;
  const defaultReps = Number(el<HTMLInputElement>("defaultReps").value) || 0;
  const defaultWeightKg = Number(el<HTMLInputElement>("defaultWeight").value) || 0;

  if (!name) return setStatus("Enter an exercise name.");
  if (!type) return setStatus("Select an exercise type.");
  if (!muscleGroup) return setStatus("Select a muscle group.");

  const editId = el<HTMLButtonElement>("addExerciseBtn").dataset.editId;

  try {
    if (editId) {
      await window.TrainingAPI.put(`/api/user-exercises/${editId}`, { name, type, muscleGroup, defaultSets, defaultReps, defaultWeightKg });
      delete el<HTMLButtonElement>("addExerciseBtn").dataset.editId;
      el<HTMLButtonElement>("addExerciseBtn").textContent = "Add Exercise";
      setStatus("Exercise updated!");
    } else {
      const id = toKebab(name);
      await window.TrainingAPI.post("/api/user-exercises", { id, name, type, muscleGroup, defaultSets, defaultReps, defaultWeightKg });
      setStatus("Exercise added!");
    }

    // Clear form
    el<HTMLInputElement>("exerciseName").value = "";
    el<HTMLSelectElement>("exerciseType").value = "";
    el<HTMLSelectElement>("muscleGroup").value = "";
    el<HTMLInputElement>("defaultSets").value = "";
    el<HTMLInputElement>("defaultReps").value = "";
    el<HTMLInputElement>("defaultWeight").value = "";

    await loadExercises();
  } catch {
    setStatus("Failed to save exercise.");
  }
});

void loadUnits();
void loadExercises();
