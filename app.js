const COLS = ["Phase","Order","Exercise","Weight","Sets","Reps","Volume","Notes","Formula"];
const tbody = document.querySelector("#workoutTable tbody");
const storageKey = "training_app_rows_v1";
let rows = [];
let volumeChart, summaryChart;

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

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
      header.push((ws[addr]?.v || "").toString());
    }
    const parsed = [];
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      const obj = {};
      header.forEach((h, cIdx) => {
        const addr = XLSX.utils.encode_cell({ r, c: range.s.c + cIdx });
        const cell = ws[addr];
        obj[h] = cell?.v ?? "";
        if (h === "Volume" && cell?.f) obj.Formula = "=" + cell.f;
      });
      if (Object.values(obj).some(v => String(v).trim() !== "")) parsed.push(normalize(obj));
    }
    rows = parsed;
    renderTable();
    drawCharts();
  };
  reader.readAsArrayBuffer(file);
}

document.getElementById("xlsxInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) loadXlsx(file);
});
document.getElementById("loadCsvBtn").addEventListener("click", loadCsv);
document.getElementById("saveBtn").addEventListener("click", saveLocal);
document.getElementById("resetBtn").addEventListener("click", () => { localStorage.removeItem(storageKey); loadCsv(); });

if (!loadLocal()) loadCsv();
renderTable();
drawCharts();
