import { useState, useEffect, useCallback } from "react";
import { useRoutines } from "../../hooks/useRoutines";
import { useCatalogExercises, useUserExercises } from "../../hooks/useExercises";
import { useSaveWorkout } from "../../hooks/useWorkoutLog";
import { useUnits } from "../../hooks/useProfile";
import type { ExerciseLog, SetLog } from "../../types";

const SESSION_KEY = "training_active_workout";

interface WorkoutState {
  routineId: string;
  routineName: string;
  startedAt: string;
  currentIndex: number;
  exerciseLogs: ExerciseLog[];
}

export function WorkoutPage() {
  const units = useUnits();
  const { data: routines = [] } = useRoutines();
  const { data: catalog = [] } = useCatalogExercises();
  const { data: userEx = [] } = useUserExercises();
  const saveWorkout = useSaveWorkout();

  const [selectedRoutine, setSelectedRoutine] = useState("");
  const [workout, setWorkout] = useState<WorkoutState | null>(null);
  const [currentSets, setCurrentSets] = useState<SetLog[]>([]);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState<WorkoutState | null>(null);
  const [status, setStatus] = useState("");

  const exerciseNames: Record<string, string> = {};
  [...catalog, ...userEx].forEach((e) => { exerciseNames[e.id] = e.name; });

  // Restore session
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const state = JSON.parse(raw) as WorkoutState;
        setWorkout(state);
        setupSets(state);
      }
    } catch { /* no session */ }
  }, []);

  const saveSession = useCallback((state: WorkoutState) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }, []);

  function setupSets(state: WorkoutState) {
    const idx = state.currentIndex;
    if (idx >= state.exerciseLogs.length) return;
    const log = state.exerciseLogs[idx];
    const existing = log.setsCompleted;
    setCurrentSets(
      Array.from({ length: log.targetSets }, (_, i) => existing[i] || {
        setNumber: i + 1,
        repsCompleted: log.targetReps,
        weightUsedKg: 0,
      }),
    );
  }

  function startWorkout() {
    if (!selectedRoutine) return setStatus("Select a routine first");
    const routine = routines.find((r) => r.id === selectedRoutine);
    if (!routine?.exercises?.length) return setStatus("This routine has no exercises");

    const state: WorkoutState = {
      routineId: routine.id,
      routineName: routine.name,
      startedAt: new Date().toISOString(),
      currentIndex: 0,
      exerciseLogs: routine.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: exerciseNames[ex.exerciseId] || ex.exerciseId,
        targetSets: ex.sets,
        targetReps: ex.reps,
        setsCompleted: [],
      })),
    };
    setWorkout(state);
    saveSession(state);
    setupSets(state);
    setStatus("");
  }

  function logAndNext() {
    if (!workout) return;
    const updated = { ...workout, exerciseLogs: [...workout.exerciseLogs] };
    updated.exerciseLogs[workout.currentIndex] = {
      ...updated.exerciseLogs[workout.currentIndex],
      setsCompleted: [...currentSets],
    };
    updated.currentIndex++;
    setWorkout(updated);
    saveSession(updated);
    if (updated.currentIndex < updated.exerciseLogs.length) {
      setupSets(updated);
    }
  }

  async function finishWorkout() {
    if (!workout) return;
    const payload = {
      routineId: workout.routineId,
      routineName: workout.routineName,
      startedAt: workout.startedAt,
      completedAt: new Date().toISOString(),
      exercises: workout.exerciseLogs,
    };
    saveWorkout.mutate(payload, {
      onSuccess: () => {
        sessionStorage.removeItem(SESSION_KEY);
        setSummary(workout);
        setWorkout(null);
        setFinished(true);
      },
      onError: () => setStatus("Failed to save workout"),
    });
  }

  function updateSet(idx: number, field: "repsCompleted" | "weightUsedKg", value: number) {
    setCurrentSets((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: Math.max(0, value) } : s));
  }

  // Summary view
  if (finished && summary) {
    const totalSets = summary.exerciseLogs.reduce((n, ex) => n + ex.setsCompleted.length, 0);
    const totalVolume = summary.exerciseLogs.reduce((v, ex) =>
      v + ex.setsCompleted.reduce((s, set) => s + set.repsCompleted * set.weightUsedKg, 0), 0);

    return (
      <div className="page">
        <h1>Workout Complete!</h1>
        <div className="card">
          <p><strong>{summary.exerciseLogs.length}</strong> exercises · <strong>{totalSets}</strong> sets · <strong>{totalVolume.toLocaleString()}</strong> {units} volume</p>
          {summary.exerciseLogs.map((ex) => {
            const exVol = ex.setsCompleted.reduce((s, set) => s + set.repsCompleted * set.weightUsedKg, 0);
            return (
              <div key={ex.exerciseId} className="row-card">
                <strong>{ex.exerciseName}</strong>
                <span className="hint block">{ex.setsCompleted.length} sets · {exVol.toLocaleString()} {units} volume</span>
              </div>
            );
          })}
          <button className="btn-primary btn-full" style={{ marginTop: 12 }} onClick={() => { setFinished(false); setSummary(null); }}>
            Back to Workout
          </button>
        </div>
      </div>
    );
  }

  // Active workout
  if (workout) {
    const { currentIndex, exerciseLogs, routineName } = workout;
    const allDone = currentIndex >= exerciseLogs.length;

    return (
      <div className="page">
        <div className="workout-header">
          <h1>{routineName}</h1>
          <span className="hint">{allDone ? "All done!" : `${currentIndex + 1} of ${exerciseLogs.length}`}</span>
        </div>

        {/* Progress bar */}
        <div className="workout-progress">
          <div className="workout-progress-fill" style={{ width: `${(currentIndex / exerciseLogs.length) * 100}%` }} />
        </div>

        {!allDone && (
          <>
            <div className="card workout-exercise-card">
              <h2>{exerciseLogs[currentIndex].exerciseName}</h2>
              <p className="hint">Target: {exerciseLogs[currentIndex].targetSets} sets &times; {exerciseLogs[currentIndex].targetReps} reps</p>
              <div className="sets-container">
                {currentSets.map((s, idx) => (
                  <div key={idx} className="set-row-enhanced">
                    <span className="set-number">{idx + 1}</span>
                    <div>
                      <div className="stepper">
                        <button type="button" className="stepper-btn" onClick={() => updateSet(idx, "repsCompleted", Math.max(0, s.repsCompleted - 1))}>-</button>
                        <input type="number" value={s.repsCompleted || ""} onChange={(e) => updateSet(idx, "repsCompleted", Number(e.target.value))} placeholder="0" />
                        <button type="button" className="stepper-btn" onClick={() => updateSet(idx, "repsCompleted", s.repsCompleted + 1)}>+</button>
                      </div>
                      <div className="stepper-label">Reps</div>
                    </div>
                    <div>
                      <div className="stepper">
                        <button type="button" className="stepper-btn" onClick={() => updateSet(idx, "weightUsedKg", Math.max(0, s.weightUsedKg - 5))}>-</button>
                        <input type="number" value={s.weightUsedKg || ""} onChange={(e) => updateSet(idx, "weightUsedKg", Number(e.target.value))} placeholder="0" />
                        <button type="button" className="stepper-btn" onClick={() => updateSet(idx, "weightUsedKg", s.weightUsedKg + 5)}>+</button>
                      </div>
                      <div className="stepper-label">{units}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-success btn-full" onClick={logAndNext}>
              {currentIndex + 1 < exerciseLogs.length ? "Log & Next Exercise" : "Log & Finish"}
            </button>

            {currentIndex + 1 < exerciseLogs.length && (
              <div className="card" style={{ marginTop: 12 }}>
                <h3 className="hint">Up Next</h3>
                {exerciseLogs.slice(currentIndex + 1).map((ex) => (
                  <div key={ex.exerciseId} className="row-card row-card-flex">
                    <span>{ex.exerciseName}</span>
                    <span className="hint">{ex.targetSets}&times;{ex.targetReps}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {allDone && (
          <div className="card">
            <div className="workout-complete-anim">
              <div className="workout-complete-ring">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="36" stroke="var(--accent)" strokeWidth="3" opacity="0.2" />
                  <circle cx="40" cy="40" r="36" stroke="var(--accent)" strokeWidth="3" strokeDasharray="226" strokeDashoffset="0" strokeLinecap="round" />
                  <polyline className="check-path" points="26,42 36,52 56,30" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <span className="workout-complete-text">All exercises logged!</span>
            </div>
            <button className="btn-primary btn-full" onClick={finishWorkout} disabled={saveWorkout.isPending}>
              {saveWorkout.isPending ? "Saving..." : "Finish Workout"}
            </button>
          </div>
        )}
        {status && <p className="hint">{status}</p>}
      </div>
    );
  }

  // Routine selector
  return (
    <div className="page">
      <h1>Start Workout</h1>
      <div className="card">
        <div className="form-stack">
          {routines.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="4" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
              </div>
              <p>No routines yet. Create one from the Dashboard first.</p>
            </div>
          ) : (
            <>
              <select value={selectedRoutine} onChange={(e) => setSelectedRoutine(e.target.value)}>
                <option value="">Select a routine...</option>
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.exercises.length} exercises)</option>
                ))}
              </select>
              <button className="btn-success" onClick={startWorkout} disabled={!selectedRoutine}>Start Workout</button>
            </>
          )}
          {status && <p className="hint">{status}</p>}
        </div>
      </div>
    </div>
  );
}
