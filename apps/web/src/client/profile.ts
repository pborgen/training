/* Profile page logic */

declare global {
  interface Window { TrainingAuth: any; TrainingAPI: any; }
}

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

/* Auth guard */
try { window.TrainingAuth.requireAuth(); } catch { throw new Error("redirecting"); }

let currentUnits = "lbs";

function setStatus(text: string) { el("status").textContent = text; }

function setUnit(unit: string) {
  currentUnits = unit;
  document.querySelectorAll("#unitToggle button").forEach(b => {
    b.classList.toggle("active", (b as HTMLButtonElement).dataset.unit === unit);
  });
  el<HTMLInputElement>("weightKg").placeholder = `Weight (${unit})`;
}

/* Load profile */
(async () => {
  try {
    const p = await window.TrainingAPI.get("/api/profile") as Record<string, any>;
    if (p.fullName) el<HTMLInputElement>("fullName").value = p.fullName;
    if (p.age) el<HTMLInputElement>("age").value = String(p.age);
    if (p.gender) el<HTMLSelectElement>("gender").value = p.gender;
    if (p.heightCm) el<HTMLInputElement>("heightCm").value = String(p.heightCm);
    if (p.weightKg) el<HTMLInputElement>("weightKg").value = String(p.weightKg);
    if (p.activityLevel) el<HTMLSelectElement>("activityLevel").value = p.activityLevel;
    if (p.units) setUnit(p.units);
  } catch {
    /* new user, no profile yet */
  }
})();

/* Unit toggle */
document.querySelectorAll("#unitToggle button").forEach(b => {
  b.addEventListener("click", () => setUnit((b as HTMLButtonElement).dataset.unit || "lbs"));
});

/* Save */
el("saveBtn").addEventListener("click", async () => {
  const profile = {
    fullName: el<HTMLInputElement>("fullName").value.trim(),
    age: Number(el<HTMLInputElement>("age").value) || 0,
    gender: el<HTMLSelectElement>("gender").value,
    heightCm: Number(el<HTMLInputElement>("heightCm").value) || 0,
    weightKg: Number(el<HTMLInputElement>("weightKg").value) || 0,
    activityLevel: el<HTMLSelectElement>("activityLevel").value,
    units: currentUnits,
  };

  if (!profile.fullName) return setStatus("Please enter your name.");

  try {
    await window.TrainingAPI.put("/api/profile", profile);
    setStatus("Profile saved!");
  } catch {
    setStatus("Failed to save profile.");
  }
});
