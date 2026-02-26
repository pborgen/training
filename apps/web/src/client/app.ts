type Row = Record<string, string>;

declare global {
  interface Window {
    Chart: any;
    XLSX: any;
    google: any;
    TrainingAuth: any;
  }
}

const COLS = ["Phase","Order","Exercise","Weight","Sets","Reps","Volume","Notes","Formula"] as const;
const tbody = document.querySelector("#workoutTable tbody") as HTMLTableSectionElement;
const cards = document.getElementById("workoutCards") as HTMLDivElement;
const storageKey = "training_app_rows_v1";
const prefsKey = "training_app_prefs_v1";
let rows: Row[] = [];
let volumeChart: any, summaryChart: any;
let googleIdToken = window.TrainingAuth?.getAuth()?.idToken || "";

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function num(v: string) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function stamp() { return new Date().toISOString(); }

function setStatus(text: string) { el<HTMLElement>("status").textContent = text; }
function setLastSync(text: string) { el<HTMLElement>("lastSync").textContent = `Last Sync: ${text}`; }
function setSession(auth: boolean, email = "") {
  el<HTMLElement>("sessionStatus").textContent = auth ? `Authenticated: Yes (${email})` : "Authenticated: No";
}

function getPrefs() {
  return {
    googleClientId: el<HTMLInputElement>("googleClientId")?.value?.trim() || "",
    syncEndpoint: el<HTMLInputElement>("syncEndpoint")?.value?.trim() || ""
  };
}

function savePrefs() { localStorage.setItem(prefsKey, JSON.stringify(getPrefs())); }

function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(prefsKey) || "{}");
    if (p.googleClientId) el<HTMLInputElement>("googleClientId").value = p.googleClientId;
    el<HTMLInputElement>("syncEndpoint").value = p.syncEndpoint || `${location.origin}/api/sync`;
  } catch {
    el<HTMLInputElement>("syncEndpoint").value = `${location.origin}/api/sync`;
  }
}

function safeEvalMath(expr: string): number {
  const cleaned = expr.replace(/[^0-9+\-*/(). ]/g, "");
  if (!cleaned.trim()) return 0;
  const v = Function(`"use strict"; return (${cleaned});`)();
  return Number.isFinite(v) ? Number(v) : 0;
}

function evalFormulaForRow(formula: string, row: Row): number {
  let f = formula.trim();
  if (f.startsWith("=")) f = f.slice(1);
  f = f.replace(/SUM\(/gi, "(");
  f = f.replace(/D\d+/gi, row.Weight || "0");
  f = f.replace(/E\d+/gi, row.Sets || "0");
  f = f.replace(/F\d+/gi, row.Reps || "0");
  f = f.replace(/G\d+/gi, row.Volume || "0");
  return safeEvalMath(f);
}

function normalize(row: Row): Row {
  const out = Object.fromEntries(COLS.map(c => [c, row[c] ?? ""])) as Row;

  if (out.Formula?.includes("Weight=")) {
    const m = out.Formula.match(/Weight=([^|]+)/);
    if (m) out.Weight = String(evalFormulaForRow(m[1], out));
  }
  if (out.Formula?.includes("Volume=")) {
    const m = out.Formula.match(/Volume=([^|]+)/);
    if (m) out.Volume = String(evalFormulaForRow(m[1], out));
  }

  if (!out.Volume && out.Weight && out.Sets && out.Reps) {
    out.Volume = String(num(out.Weight) * num(out.Sets) * num(out.Reps));
  }
  return out;
}

function updateCell(idx: number, key: string, value: string) {
  rows[idx][key] = value;
  if (["Weight", "Sets", "Reps", "Formula"].includes(key)) rows[idx] = normalize(rows[idx]);
  renderAll();
}

function renderCards() {
  cards.innerHTML = "";
  rows.forEach((r, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "row-card";

    const makeInput = (label: string, key: string, full = false) => {
      const d = document.createElement("div");
      if (full) d.classList.add("full");
      const i = document.createElement("input");
      i.placeholder = label;
      i.value = r[key] ?? "";
      i.addEventListener("change", () => updateCell(idx, key, i.value));
      d.appendChild(i);
      return d;
    };

    const grid = document.createElement("div");
    grid.className = "row-grid";
    grid.append(
      makeInput("Exercise", "Exercise", true),
      makeInput("Phase", "Phase"),
      makeInput("Order", "Order"),
      makeInput("Weight", "Weight"),
      makeInput("Sets", "Sets"),
      makeInput("Reps", "Reps"),
      makeInput("Volume", "Volume"),
      makeInput("Notes", "Notes", true),
      makeInput("Formula", "Formula", true)
    );

    const recalc = document.createElement("button");
    recalc.className = "small-btn";
    recalc.textContent = "Recalc";
    recalc.addEventListener("click", () => {
      rows[idx].Volume = String(num(rows[idx].Weight) * num(rows[idx].Sets) * num(rows[idx].Reps));
      renderAll();
    });

    wrap.append(grid, recalc);
    cards.appendChild(wrap);
  });
}

function renderTable() {
  tbody.innerHTML = "";
  rows.forEach((r, idx) => {
    const tr = document.createElement("tr");
    COLS.forEach((c) => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.value = r[c] ?? "";
      input.addEventListener("change", () => updateCell(idx, c, input.value));
      td.appendChild(input); tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function drawCharts() {
  const exerciseVolume: Record<string, number> = {};
  let totalSets = 0, totalReps = 0;
  rows.forEach(r => {
    const ex = r.Exercise || "Unknown";
    exerciseVolume[ex] = (exerciseVolume[ex] || 0) + num(r.Volume);
    totalSets += num(r.Sets);
    totalReps += num(r.Reps);
  });

  if (volumeChart) volumeChart.destroy();
  volumeChart = new window.Chart(document.getElementById("volumeByExercise"), {
    type: "bar",
    data: { labels: Object.keys(exerciseVolume), datasets: [{ label: "Volume by Exercise", data: Object.values(exerciseVolume) }] }
  });

  if (summaryChart) summaryChart.destroy();
  summaryChart = new window.Chart(document.getElementById("setsRepsSummary"), {
    type: "pie",
    data: { labels: ["Total Sets","Total Reps"], datasets: [{ data: [totalSets, totalReps] }] }
  });
}

function renderAll() {
  renderCards();
  renderTable();
  drawCharts();
}

function saveLocal() {
  localStorage.setItem(storageKey, JSON.stringify(rows));
  savePrefs();
  setStatus("Saved locally");
}

function loadLocal() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return false;
  rows = (JSON.parse(raw) as Row[]).map(normalize);
  return true;
}

async function loadCsv() {
  const text = await fetch("./data/first_tab.csv").then(r => r.text());
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift()!.split(",");
  rows = lines.map(line => {
    const parts = line.split(",");
    const r: Row = {};
    headers.forEach((h, i) => { r[h.trim()] = (parts[i] || "").replace(/^"|"$/g, ""); });
    return normalize(r);
  });
  renderAll();
  setStatus("Loaded CSV");
}

function loadXlsx(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target!.result as ArrayBuffer);
    const wb = window.XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const range = window.XLSX.utils.decode_range(ws["!ref"]);
    const header: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = window.XLSX.utils.encode_cell({ r: range.s.r, c });
      header.push((ws[addr]?.v || "").toString().trim());
    }

    const parsed: Row[] = [];
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      const obj: Row = {}; const formulas: string[] = [];
      header.forEach((h, cIdx) => {
        const addr = window.XLSX.utils.encode_cell({ r, c: range.s.c + cIdx });
        const cell = ws[addr];
        const key = h || `Col${cIdx + 1}`;
        obj[key] = String(cell?.v ?? "");
        if (cell?.f) formulas.push(`${key}=${cell.f}`);
      });
      obj.Formula = formulas.join(" | ");
      if (Object.values(obj).some(v => String(v).trim() !== "")) parsed.push(normalize(obj));
    }

    rows = parsed;
    renderAll();
    setStatus("Loaded XLSX");
  };
  reader.readAsArrayBuffer(file);
}

function exportJson() {
  const blob = new Blob([JSON.stringify({ rows, exportedAt: stamp() }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "training-data.json";
  a.click();
}

function importJson(file: File) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const parsed = JSON.parse(fr.result as string) as { rows?: Row[] };
      rows = (parsed.rows || []).map(normalize);
      renderAll();
      setStatus("Imported JSON");
    } catch {
      setStatus("Invalid JSON file");
    }
  };
  fr.readAsText(file);
}

function googleSignIn() {
  const clientId = el<HTMLInputElement>("googleClientId").value.trim();
  if (!clientId) return setStatus("Enter Google Client ID first");
  savePrefs();

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (resp: { credential: string }) => {
      googleIdToken = resp.credential;
      try {
        const payload = JSON.parse(atob(resp.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        window.TrainingAuth?.setAuth(resp.credential, payload.email || "");
      } catch { /* ignore decode errors */ }
      el<HTMLElement>("userLabel").textContent = "Google sign-in connected";
      void sessionCheck();
    }
  });
  window.google.accounts.id.prompt();
}

function authHeaders(): Record<string,string> {
  const headers: Record<string,string> = {};
  if (googleIdToken) headers["Authorization"] = `Bearer ${googleIdToken}`;
  return headers;
}

async function sessionCheck() {
  const endpoint = el<HTMLInputElement>("syncEndpoint").value.trim();
  if (!endpoint) return;
  const base = endpoint.replace(/\/api\/sync$/, "");
  const res = await fetch(`${base}/api/session`, { headers: authHeaders() });
  if (!res.ok) {
    setSession(false);
    return;
  }
  const data = await res.json() as { email?: string; authenticated?: boolean };
  setSession(Boolean(data.authenticated), data.email || "");
}

async function pushSync() {
  const url = el<HTMLInputElement>("syncEndpoint").value.trim();
  if (!url) return setStatus("Set sync endpoint URL first");
  savePrefs();

  const payload = { rows, syncedAt: stamp() };
  const headers: Record<string,string> = { "Content-Type": "application/json", ...authHeaders() };
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!res.ok) return setStatus(`Push failed (${res.status})`);
  setLastSync(stamp());
  setStatus("Push sync complete");
  await sessionCheck();
}

async function pullSync() {
  const url = el<HTMLInputElement>("syncEndpoint").value.trim();
  if (!url) return setStatus("Set sync endpoint URL first");
  savePrefs();

  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) return setStatus(`Pull failed (${res.status})`);
  const data = await res.json() as { rows?: Row[] };
  rows = (data.rows || []).map(normalize);
  renderAll();
  setLastSync(stamp());
  setStatus("Pull sync complete");
  await sessionCheck();
}

function addRow() {
  rows.push(normalize({}));
  renderAll();
}

el<HTMLInputElement>("xlsxInput").addEventListener("change", (e) => {
  const file = (e.target as HTMLInputElement).files?.[0]; if (file) loadXlsx(file);
});
el<HTMLInputElement>("importJsonInput").addEventListener("change", (e) => {
  const file = (e.target as HTMLInputElement).files?.[0]; if (file) importJson(file);
});
el<HTMLButtonElement>("loadCsvBtn").addEventListener("click", () => void loadCsv());
el<HTMLButtonElement>("saveBtn").addEventListener("click", saveLocal);
el<HTMLButtonElement>("resetBtn").addEventListener("click", () => { localStorage.removeItem(storageKey); void loadCsv(); });
el<HTMLButtonElement>("exportJsonBtn").addEventListener("click", exportJson);
el<HTMLButtonElement>("googleSignInBtn").addEventListener("click", googleSignIn);
el<HTMLButtonElement>("sessionBtn").addEventListener("click", () => void sessionCheck());
el<HTMLButtonElement>("pushSyncBtn").addEventListener("click", () => void pushSync());
el<HTMLButtonElement>("pullSyncBtn").addEventListener("click", () => void pullSync());
el<HTMLButtonElement>("addRowBtn").addEventListener("click", addRow);

/* Auth guard: redirect to login if not authenticated */
if (window.TrainingAuth && !window.TrainingAuth.getAuth()) {
  window.location.href = "/login.html";
  throw new Error("redirecting");
}

loadPrefs();
if (!loadLocal()) void loadCsv();
renderAll();
void sessionCheck();
