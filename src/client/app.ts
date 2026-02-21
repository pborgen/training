type Row = Record<string, string>;

const COLS = ["Phase","Order","Exercise","Weight","Sets","Reps","Volume","Notes","Formula"] as const;
const tbody = document.querySelector("#workoutTable tbody") as HTMLTableSectionElement;
const storageKey = "training_app_rows_v1";
const prefsKey = "training_app_prefs_v1";
let rows: Row[] = [];
let volumeChart: any, summaryChart: any;
let googleIdToken = "";

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function num(v: string) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

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

function normalize(row: Row): Row {
  const out = Object.fromEntries(COLS.map(c => [c, row[c] ?? ""])) as Row;
  if (!out.Volume && out.Weight && out.Sets && out.Reps) out.Volume = String(num(out.Weight) * num(out.Sets) * num(out.Reps));
  return out;
}

function renderTable() {
  tbody.innerHTML = "";
  rows.forEach((r, idx) => {
    const tr = document.createElement("tr");
    COLS.forEach((c) => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.value = r[c] ?? "";
      input.addEventListener("change", () => {
        rows[idx][c] = input.value;
        if (["Weight","Sets","Reps"].includes(c)) {
          rows[idx].Volume = String(num(rows[idx].Weight) * num(rows[idx].Sets) * num(rows[idx].Reps));
          renderTable();
        }
        drawCharts();
      });
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
    totalSets += num(r.Sets); totalReps += num(r.Reps);
  });

  const labels = Object.keys(exerciseVolume);
  const values = Object.values(exerciseVolume);

  if (volumeChart) volumeChart.destroy();
  volumeChart = new (window as any).Chart(document.getElementById("volumeByExercise"), {
    type: "bar",
    data: { labels, datasets: [{ label: "Volume by Exercise", data: values }] }
  });

  if (summaryChart) summaryChart.destroy();
  summaryChart = new (window as any).Chart(document.getElementById("setsRepsSummary"), {
    type: "pie",
    data: { labels: ["Total Sets","Total Reps"], datasets: [{ data: [totalSets, totalReps] }] }
  });
}

function saveLocal() { localStorage.setItem(storageKey, JSON.stringify(rows)); savePrefs(); alert("Saved locally"); }
function loadLocal() {
  const raw = localStorage.getItem(storageKey); if (!raw) return false;
  rows = (JSON.parse(raw) as Row[]).map(normalize); return true;
}

async function loadCsv() {
  const text = await fetch("./data/first_tab.csv").then(r => r.text());
  const lines = text.trim().split(/\r?\n/); const headers = lines.shift()!.split(",");
  rows = lines.map(line => {
    const parts = line.split(","); const r: Row = {};
    headers.forEach((h, i) => { r[h.trim()] = (parts[i] || "").replace(/^"|"$/g, ""); });
    return normalize(r);
  });
  renderTable(); drawCharts();
}

function loadXlsx(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target!.result as ArrayBuffer);
    const wb = (window as any).XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const range = (window as any).XLSX.utils.decode_range(ws["!ref"]);
    const header: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = (window as any).XLSX.utils.encode_cell({ r: range.s.r, c });
      header.push((ws[addr]?.v || "").toString().trim());
    }

    const parsed: Row[] = [];
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      const obj: Row = {}; const formulas: string[] = [];
      header.forEach((h, cIdx) => {
        const addr = (window as any).XLSX.utils.encode_cell({ r, c: range.s.c + cIdx });
        const cell = ws[addr]; const key = h || `Col${cIdx + 1}`;
        obj[key] = String(cell?.v ?? ""); if (cell?.f) formulas.push(`${key}=${cell.f}`);
      });
      obj.Formula = formulas.join(" | ");
      if (Object.values(obj).some(v => String(v).trim() !== "")) parsed.push(normalize(obj));
    }
    rows = parsed; renderTable(); drawCharts();
  };
  reader.readAsArrayBuffer(file);
}

function exportJson() {
  const blob = new Blob([JSON.stringify({ rows, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "training-data.json"; a.click();
}

function importJson(file: File) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const parsed = JSON.parse(fr.result as string) as { rows?: Row[] };
      rows = (parsed.rows || []).map(normalize);
      renderTable(); drawCharts();
    } catch { alert("Invalid JSON file"); }
  };
  fr.readAsText(file);
}

function googleSignIn() {
  const clientId = el<HTMLInputElement>("googleClientId").value.trim();
  if (!clientId) return alert("Enter Google Client ID first");
  savePrefs();

  (window as any).google.accounts.id.initialize({
    client_id: clientId,
    callback: (resp: { credential: string }) => {
      googleIdToken = resp.credential;
      el<HTMLElement>("userLabel").textContent = "Google sign-in connected";
    }
  });
  (window as any).google.accounts.id.prompt();
}

async function pushSync() {
  const url = el<HTMLInputElement>("syncEndpoint").value.trim();
  if (!url) return alert("Set sync endpoint URL first");
  savePrefs();

  const payload = { rows, syncedAt: new Date().toISOString() };
  const headers: Record<string,string> = { "Content-Type": "application/json" };
  if (googleIdToken) headers["Authorization"] = `Bearer ${googleIdToken}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!res.ok) return alert(`Push failed (${res.status})`);
  alert("Push sync complete");
}

async function pullSync() {
  const url = el<HTMLInputElement>("syncEndpoint").value.trim();
  if (!url) return alert("Set sync endpoint URL first");
  savePrefs();

  const headers: Record<string,string> = {};
  if (googleIdToken) headers["Authorization"] = `Bearer ${googleIdToken}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return alert(`Pull failed (${res.status})`);
  const data = await res.json() as { rows?: Row[] };
  rows = (data.rows || []).map(normalize); renderTable(); drawCharts(); alert("Pull sync complete");
}

el<HTMLInputElement>("xlsxInput").addEventListener("change", (e) => {
  const file = (e.target as HTMLInputElement).files?.[0]; if (file) loadXlsx(file);
});
el<HTMLInputElement>("importJsonInput").addEventListener("change", (e) => {
  const file = (e.target as HTMLInputElement).files?.[0]; if (file) importJson(file);
});
el<HTMLButtonElement>("loadCsvBtn").addEventListener("click", loadCsv);
el<HTMLButtonElement>("saveBtn").addEventListener("click", saveLocal);
el<HTMLButtonElement>("resetBtn").addEventListener("click", () => { localStorage.removeItem(storageKey); loadCsv(); });
el<HTMLButtonElement>("exportJsonBtn").addEventListener("click", exportJson);
el<HTMLButtonElement>("googleSignInBtn").addEventListener("click", googleSignIn);
el<HTMLButtonElement>("pushSyncBtn").addEventListener("click", pushSync);
el<HTMLButtonElement>("pullSyncBtn").addEventListener("click", pullSync);

loadPrefs();
if (!loadLocal()) loadCsv();
renderTable();
drawCharts();
