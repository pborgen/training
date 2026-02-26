/* Dashboard – "My Workouts" hub */

declare global {
  interface Window { TrainingAuth: any; TrainingAPI: any; }
}

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

/* Auth guard */
let auth: { idToken: string; email: string };
try { auth = window.TrainingAuth.requireAuth(); } catch { throw new Error("redirecting"); }

el("userInfo").textContent = auth.email;
el("signOutBtn").addEventListener("click", () => {
  window.TrainingAuth.clearAuth();
  window.location.href = "/login.html";
});

let units = "lbs";

async function loadUnits() {
  try {
    const p = await window.TrainingAPI.get("/api/profile") as Record<string, any>;
    if (p.units) units = p.units;
  } catch { /* no profile yet */ }
}

/* ── Routines ── */
async function loadRoutines() {
  const container = el("routinesList");
  const empty = el("routinesEmpty");
  try {
    const routines = await window.TrainingAPI.get("/api/routines") as any[];
    empty.style.display = routines.length ? "none" : "";
    container.innerHTML = "";

    routines.forEach((r: any) => {
      const card = document.createElement("div");
      card.className = "row-card";

      const goalBadge = r.goal ? `<span class="badge">${r.goal.replace("_", " ")}</span>` : "";
      const exCount = Array.isArray(r.exercises) ? r.exercises.length : 0;

      card.innerHTML =
        `<div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" class="routine-toggle">` +
        `<div><strong>${r.name}</strong> ${goalBadge}` +
        `<span class="hint" style="display:block;margin-top:2px">${exCount} exercise${exCount !== 1 ? "s" : ""}${r.daysPerWeek ? ` · ${r.daysPerWeek} days/wk` : ""}</span></div>` +
        `<span class="hint" style="font-size:18px">▸</span>` +
        `</div>` +
        `<div class="routine-detail">` +
        (Array.isArray(r.exercises) ? r.exercises.map((ex: any) =>
          `<div class="hint" style="padding:4px 0;border-top:1px solid #1e293b">${ex.exerciseName || ex.exerciseId} — ${ex.sets}×${ex.reps} @ ${ex.weightKg} ${units}</div>`
        ).join("") : "") +
        `<div class="btn-row" style="margin-top:6px">` +
        `<a href="/routine-builder.html?id=${r.id}" class="btn-edit" style="text-decoration:none">Edit</a>` +
        `<button class="btn-delete" data-id="${r.id}">Delete</button>` +
        `</div>` +
        `</div>`;

      container.appendChild(card);

      /* Toggle expand/collapse */
      card.querySelector(".routine-toggle")!.addEventListener("click", () => {
        const detail = card.querySelector(".routine-detail") as HTMLElement;
        detail.classList.toggle("open");
        const arrow = card.querySelector(".routine-toggle .hint:last-child") as HTMLElement;
        if (arrow) arrow.textContent = detail.classList.contains("open") ? "▾" : "▸";
      });

      /* Delete */
      card.querySelector(".btn-delete")!.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`Delete routine "${r.name}"?`)) return;
        try {
          await window.TrainingAPI.del(`/api/routines/${r.id}`);
          await loadRoutines();
        } catch { /* ignore */ }
      });
    });
  } catch {
    container.innerHTML = `<p class="hint">Failed to load routines.</p>`;
  }
}

/* ── Exercises ── */
async function loadExercises() {
  const container = el("exercisesList");
  const empty = el("exercisesEmpty");
  try {
    const exercises = await window.TrainingAPI.get("/api/user-exercises") as any[];
    empty.style.display = exercises.length ? "none" : "";
    container.innerHTML = "";

    exercises.forEach((ex: any) => {
      const card = document.createElement("div");
      card.className = "row-card";
      card.innerHTML =
        `<strong>${ex.name}</strong>` +
        `<span class="hint" style="display:block;margin-top:2px">${ex.muscleGroup} · ${ex.type} · ${ex.defaultSets}×${ex.defaultReps} @ ${ex.defaultWeightKg} ${units}</span>` +
        `<div class="btn-row"><button class="btn-delete" data-id="${ex.id}">Delete</button></div>`;
      container.appendChild(card);

      card.querySelector(".btn-delete")!.addEventListener("click", async () => {
        if (!confirm(`Delete exercise "${ex.name}"?`)) return;
        try {
          await window.TrainingAPI.del(`/api/user-exercises/${ex.id}`);
          await loadExercises();
        } catch { /* ignore */ }
      });
    });
  } catch {
    container.innerHTML = `<p class="hint">Failed to load exercises.</p>`;
  }
}

/* ── Workout History ── */
async function loadHistory() {
  const container = el("workoutHistory");
  const empty = el("historyEmpty");
  try {
    const log = await window.TrainingAPI.get("/api/workout-log?limit=5") as any[];
    empty.style.display = log.length ? "none" : "";
    container.innerHTML = "";

    log.forEach((entry: any) => {
      const date = entry.completedAt ? new Date(entry.completedAt).toLocaleDateString() : "—";
      let totalVolume = 0;
      if (Array.isArray(entry.exercises)) {
        entry.exercises.forEach((ex: any) => {
          if (Array.isArray(ex.setsCompleted)) {
            ex.setsCompleted.forEach((s: any) => {
              totalVolume += (s.repsCompleted || 0) * (s.weightUsedKg || 0);
            });
          }
        });
      }
      const exCount = Array.isArray(entry.exercises) ? entry.exercises.length : 0;

      const card = document.createElement("div");
      card.className = "row-card";
      card.innerHTML =
        `<strong>${entry.routineName || "Workout"}</strong>` +
        `<span class="hint" style="display:block;margin-top:2px">${date} · ${exCount} exercises · ${totalVolume.toLocaleString()} ${units} volume</span>`;
      container.appendChild(card);
    });
  } catch {
    container.innerHTML = `<p class="hint">Failed to load workout history.</p>`;
  }
}

/* Init */
(async () => {
  await loadUnits();
  await Promise.all([loadRoutines(), loadExercises(), loadHistory()]);
})();
