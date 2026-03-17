import { useRouter } from "@tanstack/react-router";
import { useRoutines, useDeleteRoutine } from "../../hooks/useRoutines";
import { useUserExercises, useDeleteExercise } from "../../hooks/useExercises";
import { useWorkoutLog } from "../../hooks/useWorkoutLog";
import { useReadiness } from "../../hooks/useReadiness";
import { useUnits } from "../../hooks/useProfile";
import type { ReadinessCheckin, WorkoutLogEntry } from "../../types";

function EmptyIcon({ type }: { type: "routine" | "exercise" | "workout" }) {
  const s = { width: 28, height: 28, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "routine") return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="4" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>;
  if (type === "exercise") return <svg viewBox="0 0 24 24" {...s}><path d="M6.5 6.5v11M17.5 6.5v11M6.5 12h11M2 8.5v7M22 8.5v7M4.25 7v10M19.75 7v10"/></svg>;
  return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

const INVERTED = new Set(["stress", "soreness"]);
function readinessScore(c: ReadinessCheckin): number {
  const keys = ["sleepQuality", "energy", "stress", "mood", "soreness", "motivation"] as const;
  const vals = keys.map(k => INVERTED.has(k) ? 11 - c[k] : c[k]);
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}
function scoreColor(s: number) { return s >= 7 ? "var(--success)" : s >= 4 ? "var(--accent)" : "var(--danger)"; }

function WeekActivityChart({ log, checkins }: { log: WorkoutLogEntry[]; checkins: ReadinessCheckin[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const dayLabels = days.map(d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "narrow" }));

  const workoutsByDay = new Map<string, number>();
  for (const entry of log) {
    const d = (entry.completedAt || entry.startedAt || "").slice(0, 10);
    workoutsByDay.set(d, (workoutsByDay.get(d) || 0) + 1);
  }

  const checkinByDay = new Map<string, ReadinessCheckin>();
  for (const c of checkins) {
    const d = c.createdAt.slice(0, 10);
    if (!checkinByDay.has(d)) checkinByDay.set(d, c);
  }

  return (
    <div className="week-chart">
      <div className="week-chart-bars">
        {days.map((d, i) => {
          const count = workoutsByDay.get(d) || 0;
          const checkin = checkinByDay.get(d);
          const score = checkin ? readinessScore(checkin) : 0;
          const today = d === new Date().toISOString().slice(0, 10);
          return (
            <div key={d} className="week-chart-col">
              <div className="week-chart-bar-track">
                {count > 0 && (
                  <div
                    className="week-chart-bar-fill workout-bar"
                    style={{ height: `${Math.min(count * 50, 100)}%` }}
                  />
                )}
                {score > 0 && (
                  <div
                    className="week-chart-readiness-dot"
                    style={{ bottom: `${((score - 1) / 9) * 100}%`, background: scoreColor(score) }}
                    title={`Readiness: ${score}`}
                  />
                )}
              </div>
              <span className={`week-chart-label ${today ? "today" : ""}`}>{dayLabels[i]}</span>
            </div>
          );
        })}
      </div>
      <div className="week-chart-legend">
        <span className="week-chart-legend-item"><span className="week-chart-legend-swatch workout" /> Workouts</span>
        <span className="week-chart-legend-item"><span className="week-chart-legend-swatch readiness" /> Readiness</span>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const router = useRouter();
  const units = useUnits();
  const { data: routines = [] } = useRoutines();
  const { data: exercises = [] } = useUserExercises();
  const { data: log = [] } = useWorkoutLog(14);
  const { data: checkins = [] } = useReadiness(14);
  const deleteRoutine = useDeleteRoutine();
  const deleteExercise = useDeleteExercise();

  return (
    <div className="page">
      <h1>Dashboard</h1>

      {/* Weekly Activity */}
      {(log.length > 0 || checkins.length > 0) && (
        <section className="card">
          <h2>This Week</h2>
          <WeekActivityChart log={log} checkins={checkins} />
        </section>
      )}

      {/* Quick Actions */}
      <div className="actions-grid">
        <button className="action-card primary" onClick={() => router.navigate({ to: "/workout" })}>
          <span className="action-icon">&#9654;</span>
          Start Workout
        </button>
        <button className="action-card" onClick={() => router.navigate({ to: "/routines/new" })}>
          <span className="action-icon">+</span>
          New Routine
        </button>
        <button className="action-card" onClick={() => router.navigate({ to: "/exercises" })}>
          <span className="action-icon">&#9883;</span>
          Add Exercise
        </button>
        <button className="action-card" onClick={() => router.navigate({ to: "/profile" })}>
          <span className="action-icon">&#9786;</span>
          Profile
        </button>
      </div>

      {/* Routines */}
      <section className="card">
        <h2>Saved Routines</h2>
        {routines.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><EmptyIcon type="routine" /></div>
            <p>No routines yet. Build your first workout plan.</p>
            <button className="btn-outline" onClick={() => router.navigate({ to: "/routines/new" })}>Create Routine</button>
          </div>
        )}
        {routines.map((r) => (
          <div key={r.id} className="row-card">
            <div className="row-card-header">
              <div>
                <strong>{r.name}</strong>
                {r.goal && <span className="badge">{r.goal.replace("_", " ")}</span>}
                <span className="hint block">
                  {r.exercises.length} exercise{r.exercises.length !== 1 ? "s" : ""}
                  {r.daysPerWeek ? ` · ${r.daysPerWeek} days/wk` : ""}
                </span>
              </div>
            </div>
            <div className="btn-row">
              <button className="btn-edit" onClick={() => router.navigate({ to: "/routines/$id/edit", params: { id: r.id } })}>Edit</button>
              <button className="btn-delete" onClick={() => { if (confirm(`Delete "${r.name}"?`)) deleteRoutine.mutate(r.id); }}>Delete</button>
            </div>
          </div>
        ))}
      </section>

      {/* Exercises */}
      <section className="card">
        <h2>My Exercises</h2>
        {exercises.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><EmptyIcon type="exercise" /></div>
            <p>No custom exercises yet. Add your own to build personalized routines.</p>
            <button className="btn-outline" onClick={() => router.navigate({ to: "/exercises" })}>Add Exercise</button>
          </div>
        )}
        {exercises.map((ex) => (
          <div key={ex.id} className="row-card">
            <strong>{ex.name}</strong>
            <span className="hint block">{ex.muscleGroup} · {ex.type} · {ex.defaultSets}&times;{ex.defaultReps} @ {ex.defaultWeightKg} {units}</span>
            <div className="btn-row">
              <button className="btn-delete" onClick={() => { if (confirm(`Delete "${ex.name}"?`)) deleteExercise.mutate(ex.id); }}>Delete</button>
            </div>
          </div>
        ))}
      </section>

      {/* Workout History */}
      <section className="card">
        <h2>Recent Workouts</h2>
        {log.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><EmptyIcon type="workout" /></div>
            <p>No workout history yet. Complete your first session to see it here.</p>
            <button className="btn-outline" onClick={() => router.navigate({ to: "/workout" })}>Start Workout</button>
          </div>
        )}
        {log.map((entry) => {
          const totalVolume = entry.exercises.reduce((sum, ex) =>
            sum + ex.setsCompleted.reduce((s, set) => s + set.repsCompleted * set.weightUsedKg, 0), 0);
          return (
            <div key={entry.id} className="row-card">
              <strong>{entry.routineName || "Workout"}</strong>
              <span className="hint block">
                {entry.completedAt ? new Date(entry.completedAt).toLocaleDateString() : "—"} · {entry.exercises.length} exercises · {totalVolume.toLocaleString()} {units} volume
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}
