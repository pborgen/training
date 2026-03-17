import { useState, useEffect } from "react";
import { useRouter, useParams } from "@tanstack/react-router";
import { useCatalogExercises, useUserExercises } from "../../hooks/useExercises";
import { useRoutine, useUpdateRoutine } from "../../hooks/useRoutines";
import { useUnits } from "../../hooks/useProfile";
import type { RoutineExercise } from "../../types";

const GOALS = ["strength", "muscle_building", "endurance", "fat_loss", "general"];

export function RoutineEditPage() {
  const router = useRouter();
  const { id } = useParams({ strict: false }) as { id: string };
  const units = useUnits();
  const { data: routine, isLoading } = useRoutine(id);
  const { data: catalog = [] } = useCatalogExercises();
  const { data: userEx = [] } = useUserExercises();
  const update = useUpdateRoutine();

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("strength");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);

  const [selectedId, setSelectedId] = useState("");
  const [exSets, setExSets] = useState(3);
  const [exReps, setExReps] = useState(10);
  const [exWeight, setExWeight] = useState(0);
  const [status, setStatus] = useState("");

  const allExercises = [...catalog.map((e) => ({ ...e, defaultWeightKg: e.defaultWeight })), ...userEx];

  useEffect(() => {
    if (routine) {
      setName(routine.name);
      setGoal(routine.goal || "strength");
      setDaysPerWeek(routine.daysPerWeek || 3);
      setExercises(
        routine.exercises.map((re) => ({
          ...re,
          exerciseName: re.exerciseName || allExercises.find((e) => e.id === re.exerciseId)?.name || re.exerciseId,
        })),
      );
    }
  }, [routine, catalog.length, userEx.length]);

  function addExercise() {
    if (!selectedId) return;
    const ex = allExercises.find((e) => e.id === selectedId);
    if (!ex) return;
    setExercises([...exercises, { exerciseId: ex.id, exerciseName: ex.name, sets: exSets || 3, reps: exReps || 10, weightKg: exWeight || 0 }]);
    setSelectedId("");
  }

  function handleSelectChange(val: string) {
    setSelectedId(val);
    const ex = allExercises.find((e) => e.id === val);
    if (ex) { setExSets(ex.defaultSets || 3); setExReps(ex.defaultReps || 10); setExWeight(ex.defaultWeightKg || 0); }
  }

  function handleSave() {
    if (!name.trim()) return setStatus("Enter a name");
    update.mutate(
      { id, name: name.trim(), goal, daysPerWeek, exercises: exercises.map(({ exerciseName: _, ...re }) => re) },
      { onSuccess: () => router.navigate({ to: "/dashboard" }), onError: () => setStatus("Failed to save") },
    );
  }

  if (isLoading) return (
    <div className="skeleton-page">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-card" />
    </div>
  );

  return (
    <div className="page">
      <h1>Edit Routine</h1>
      <div className="card">
        <div className="form-stack">
          <input placeholder="Routine name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="form-row-2">
            <select value={goal} onChange={(e) => setGoal(e.target.value)}>
              {GOALS.map((g) => <option key={g} value={g}>{g.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
            </select>
            <input type="number" placeholder="Days/wk" value={daysPerWeek || ""} onChange={(e) => setDaysPerWeek(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Add Exercises</h2>
        <div className="form-stack">
          <select value={selectedId} onChange={(e) => handleSelectChange(e.target.value)}>
            <option value="">Select exercise...</option>
            {catalog.length > 0 && (
              <optgroup label="Catalog">
                {catalog.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.muscleGroup})</option>)}
              </optgroup>
            )}
            {userEx.length > 0 && (
              <optgroup label="My Exercises">
                {userEx.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.muscleGroup})</option>)}
              </optgroup>
            )}
          </select>
          <div className="form-row-3">
            <input type="number" placeholder="Sets" value={exSets || ""} onChange={(e) => setExSets(Number(e.target.value))} />
            <input type="number" placeholder="Reps" value={exReps || ""} onChange={(e) => setExReps(Number(e.target.value))} />
            <input type="number" placeholder={`Weight (${units})`} value={exWeight || ""} onChange={(e) => setExWeight(Number(e.target.value))} />
          </div>
          <button className="btn-secondary" onClick={addExercise}>Add to Routine</button>
        </div>
      </div>

      <div className="card">
        <h2>Routine Exercises</h2>
        {exercises.length === 0 && <p className="hint">No exercises added yet</p>}
        {exercises.map((re, idx) => (
          <div key={idx} className="row-card row-card-flex">
            <div>
              <strong>{re.exerciseName}</strong>
              <span className="hint block">{re.sets}&times;{re.reps} @ {re.weightKg} {units}</span>
            </div>
            <button className="btn-delete" onClick={() => setExercises(exercises.filter((_, i) => i !== idx))}>Remove</button>
          </div>
        ))}
      </div>

      <button className="btn-primary btn-full" onClick={handleSave} disabled={update.isPending}>
        {update.isPending ? "Saving..." : "Save Changes"}
      </button>
      {status && <p className="hint" style={{ marginTop: 8 }}>{status}</p>}
    </div>
  );
}
