import { useRouter } from "@tanstack/react-router";
import { useRoutines, useDeleteRoutine } from "../../hooks/useRoutines";
import { useUserExercises, useDeleteExercise } from "../../hooks/useExercises";
import { useWorkoutLog } from "../../hooks/useWorkoutLog";
import { useUnits } from "../../hooks/useProfile";

export function DashboardPage() {
  const router = useRouter();
  const units = useUnits();
  const { data: routines = [] } = useRoutines();
  const { data: exercises = [] } = useUserExercises();
  const { data: log = [] } = useWorkoutLog(5);
  const deleteRoutine = useDeleteRoutine();
  const deleteExercise = useDeleteExercise();

  return (
    <div className="page">
      <h1>Dashboard</h1>

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
        {routines.length === 0 && <p className="hint">No routines yet</p>}
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
        {exercises.length === 0 && <p className="hint">No custom exercises yet</p>}
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
        {log.length === 0 && <p className="hint">No workout history yet</p>}
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
