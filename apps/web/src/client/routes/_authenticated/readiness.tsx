import { useState } from "react";
import { useReadiness, useSaveReadiness, useDeleteReadiness } from "../../hooks/useReadiness";

const INDICATORS = [
  { key: "sleepQuality", label: "Sleep Quality", low: "Poor", high: "Great" },
  { key: "energy", label: "Energy", low: "Drained", high: "Energized" },
  { key: "stress", label: "Stress", low: "Relaxed", high: "Overwhelmed" },
  { key: "mood", label: "Mood", low: "Low", high: "Great" },
  { key: "soreness", label: "Soreness", low: "None", high: "Very sore" },
  { key: "motivation", label: "Motivation", low: "None", high: "Fired up" },
] as const;

type Scores = Record<string, number>;

function averageScore(scores: Scores): number {
  const vals = INDICATORS.map((i) => scores[i.key] || 5);
  // Invert stress and soreness so higher = worse for readiness
  const adjusted = vals.map((v, idx) => {
    const key = INDICATORS[idx].key;
    return key === "stress" || key === "soreness" ? 11 - v : v;
  });
  return Math.round((adjusted.reduce((a, b) => a + b, 0) / adjusted.length) * 10) / 10;
}

function scoreColor(score: number): string {
  if (score >= 7) return "var(--success)";
  if (score >= 4) return "var(--accent)";
  return "var(--danger)";
}

export function ReadinessPage() {
  const { data: history = [] } = useReadiness(10);
  const save = useSaveReadiness();
  const remove = useDeleteReadiness();

  const [scores, setScores] = useState<Scores>(() =>
    Object.fromEntries(INDICATORS.map((i) => [i.key, 5])),
  );
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  function updateScore(key: string, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    save.mutate(
      { ...scores, notes } as any,
      {
        onSuccess: () => {
          setStatus("");
          setJustSaved(true);
          setScores(Object.fromEntries(INDICATORS.map((i) => [i.key, 5])));
          setNotes("");
          setTimeout(() => setJustSaved(false), 2000);
        },
        onError: () => setStatus("Failed to save"),
      },
    );
  }

  const avg = averageScore(scores);

  return (
    <div className="page">
      <h1>Readiness Check-in</h1>

      {/* Readiness score preview */}
      <div className="card" style={{ textAlign: "center" }}>
        <div className="readiness-score" style={{ color: scoreColor(avg) }}>{avg}</div>
        <p className="hint">Readiness Score</p>
      </div>

      {/* Sliders */}
      <div className="card">
        <div className="form-stack">
          {INDICATORS.map((ind) => (
            <div key={ind.key} className="slider-group">
              <div className="slider-header">
                <span className="slider-label">{ind.label}</span>
                <span className="slider-value">{scores[ind.key]}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={scores[ind.key]}
                onChange={(e) => updateScore(ind.key, Number(e.target.value))}
                className="readiness-slider"
              />
              <div className="slider-range">
                <span>{ind.low}</span>
                <span>{ind.high}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <div className="form-stack">
          <label className="form-label">
            <span className="form-label-text">Notes (optional)</span>
            <input
              placeholder="How are you feeling today?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>
      </div>

      <button className="btn-primary btn-full" onClick={handleSave} disabled={save.isPending}>
        {save.isPending ? "Saving..." : justSaved ? "Saved!" : "Log Check-in"}
      </button>
      {status && <p className="hint" style={{ marginTop: 8 }}>{status}</p>}

      {/* History */}
      {history.length > 0 && (
        <div className="card">
          <h2>Recent Check-ins</h2>
          {history.map((entry) => {
            const entryScores: Scores = {
              sleepQuality: entry.sleepQuality,
              energy: entry.energy,
              stress: entry.stress,
              mood: entry.mood,
              soreness: entry.soreness,
              motivation: entry.motivation,
            };
            const entryAvg = averageScore(entryScores);
            return (
              <div key={entry.id} className="row-card">
                <div className="row-card-header">
                  <div>
                    <strong style={{ color: scoreColor(entryAvg) }}>{entryAvg}</strong>
                    <span className="hint" style={{ marginLeft: 8 }}>
                      {new Date(entry.createdAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className="hint block">
                      Sleep {entry.sleepQuality} · Energy {entry.energy} · Stress {entry.stress} · Mood {entry.mood} · Sore {entry.soreness} · Motive {entry.motivation}
                    </span>
                    {entry.notes && <span className="hint block">{entry.notes}</span>}
                  </div>
                </div>
                <div className="btn-row">
                  <button className="btn-delete" onClick={() => { if (confirm("Delete this check-in?")) remove.mutate(entry.id); }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
