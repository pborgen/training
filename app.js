const COLS = ["Phase","Order","Exercise","Weight","Sets","Reps","Volume","Notes","Formula"];
const tbody = document.querySelector("#workoutTable tbody");
const storageKey = "training_app_rows_v1";
const prefsKey = "training_app_prefs_v1";
let rows = [];
let volumeChart, summaryChart;
let googleIdToken = "";

const el = (id) => document.getElementById(id);

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function getPrefs() {
  return {
    googleClientId: el("googleClientId")?.value?.trim() || "",
    syncEndpoint: el("syncEndpoint")?.value?.trim() || ""
  };
}

function savePrefs() {
  localStorage.setItem(prefsKey, JSON.stringify(getPrefs()));
}

function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(prefsKey) || "{}");
    if (p.googleClientId) el("googleClientId").value = p.googleClientId;
    if (p.syncEndpoint) el("syncEndpoint").value = p.syncEndpoint;
  } catch {}
}

function normalize(row) {
  const out = Object.fromEntries(COLS.map(c => [c, row[c] ?? ""]));
  if (!out.Volume && out.Weight && out.Sets && out.Reps) {
    out.Volume = String(num(out.Weight) * num(out.Sets) * num(out.Reps));
  }
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
      td.appendChild(input);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function drawCharts() {
  const exerciseVolume = {};
  let totalSets = 0, totalReps = 0;

  rows.forEach(r => {
    const ex = r.Exercise || "Unknown";
    exerciseVolume[ex] = (exerciseVolume[ex] || 0) + num(r.Volume);
    totalSets += num(r.Sets);
    totalReps += num(r.Reps);
  });

  const labels = Object.keys(exerciseVolume);
  const values = Object.values(exerciseVolume);

  if (volumeChart) volumeChart.destroy();
  volumeChart = new Chart(document.getElementById("volumeByExercise"), {
    type: "bar",
    data: { labels, datasets: [{ label: "Volume by Exercise", data: values }] },
    options: { responsive: true, plugins: { legend: { labels: { color: "#e5e7eb" } } }, scales: { x: { ticks: { color: "#e5e7eb" } }, y: { ticks: { color: "#e5e7eb" } } } }
  });

  if (summaryChart) summaryChart.destroy();
  summaryChart = new Chart(document.getElementById("setsRepsSummary"), {
    type: "pie",
    data: { labels: ["Total Sets","Total Reps"], datasets: [{ data: [totalSets, totalReps] }] },
    options: { plugins: { legend: { labels: { color: "#e5e7eb" } } } }
  });
}

function saveLocal() {
  localStorage.setItem(storageKey, JSON.stringify(rows));
  savePrefs();
  alert("Saved locally");
}

function loadLocal() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return false;
  rows = JSON.parse(raw).map(normalize);
  return true;
}

async function loadCsv() {
  const text = await fetch("./data/first_tab.csv").then(r => r.text());
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",");
  rows = lines.map(line => {
    const parts = line.split(",");
    const r = {};
    headers.forEach((h, i) => { r[h.trim()] = (parts[i] || "").replace(/^"|"$/g, ""); });
    return normalize(r);
  });
  renderTable();
  drawCharts();
}

function loadXlsx(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const range = XLSX.utils.decode_range(ws["!ref"]);
    const header = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: range.s.r, c });
      header.push((ws[addr]?.v || "").toString().trim());
    }

    const parsed = [];
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      const obj = {};
      const formulas = [];
      header.forEach((h, cIdx) => {
        const addr = XLSX.utils.encode_cell({ r, c: range.s.c + cIdx });
        const cell = ws[addr];
        const key = h || `Col${cIdx + 1}`;
        obj[key] = cell?.v ?? "";
        if (cell?.f) formulas.push(`${key}=${cell.f}`);
      });
      obj.Formula = formulas.join(" | ");
      if (Object.values(obj).some(v => String(v).trim() !== "")) parsed.push(normalize(obj));
    }

    rows = parsed;
    renderTable();
    drawCharts();
  };
  reader.readAsArrayBuffer(file);
}

function exportJson() {
  const blob = new Blob([JSON.stringify({ rows, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "training-data.json";
  a.click();
}

function importJson(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const parsed = JSON.parse(fr.result);
      rows = (parsed.rows || []).map(normalize);
      renderTable();
      drawCharts();
    } catch (e) {
      alert("Invalid JSON file");
    }
  };
  fr.readAsText(file);
}

function googleSignIn() {
  const clientId = el("googleClientId").value.trim();
  if (!clientId) return alert("Enter Google Client ID first");
  savePrefs();

  google.accounts.id.initialize({
    client_id: clientId,
    callback: (resp) => {
      googleIdToken = resp.credential;
      el("userLabel").textContent = "Google sign-in connected";
    }
  });
  google.accounts.id.prompt();
}

async function pushSync() {
  const url = el("syncEndpoint").value.trim();
  if (!url) return alert("Set sync endpoint URL first");
  savePrefs();

  const payload = { rows, syncedAt: new Date().toISOString() };
  const headers = { "Content-Type": "application/json" };
  if (googleIdToken) headers["Authorization"] = `Bearer ${googleIdToken}`;

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!res.ok) return alert(`Push failed (${res.status})`);
  alert("Push sync complete");
}

async function pullSync() {
  const url = el("syncEndpoint").value.trim();
  if (!url) return alert("Set sync endpoint URL first");
  savePrefs();

  const headers = {};
  if (googleIdToken) headers["Authorization"] = `Bearer ${googleIdToken}`;

  const res = await fetch(url, { headers });
  if (!res.ok) return alert(`Pull failed (${res.status})`);
  const data = await res.json();
  rows = (data.rows || []).map(normalize);
  renderTable();
  drawCharts();
  alert("Pull sync complete");
}

el("xlsxInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) loadXlsx(file);
});
el("importJsonInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) importJson(file);
});
el("loadCsvBtn").addEventListener("click", loadCsv);
el("saveBtn").addEventListener("click", saveLocal);
el("resetBtn").addEventListener("click", () => { localStorage.removeItem(storageKey); loadCsv(); });
el("exportJsonBtn").addEventListener("click", exportJson);
el("googleSignInBtn").addEventListener("click", googleSignIn);
el("pushSyncBtn").addEventListener("click", pushSync);
el("pullSyncBtn").addEventListener("click", pullSync);

loadPrefs();
if (!loadLocal()) loadCsv();
renderTable();
drawCharts();
