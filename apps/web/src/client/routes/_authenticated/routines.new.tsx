import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useCatalogExercises, useUserExercises } from "../../hooks/useExercises";
import { useCreateRoutine } from "../../hooks/useRoutines";
import { useUnits } from "../../hooks/useProfile";
import type { RoutineExercise } from "../../types";

const GOALS = ["strength", "muscle_building", "endurance", "fat_loss", "general"];

export function RoutineNewPage() {
  const router = useRouter();
  const units = useUnits();
  const { data: catalog = [] } = useCatalogExercises();
  const { data: userEx = [] } = useUserExercises();
  const createRoutine = useCreateRoutine();

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("strength");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);

  // Add exercise form
  const [selectedId, setSelectedId] = useState("");
  const [exSets, setExSets] = useState(3);
  const [exReps, setExReps] = useState(10);
  const [exWeight, setExWeight] = useState(0);
  const [status, setStatus] = useState("");

  const allExercises = [...catalog.map((e) => ({ ...e, defaultWeightKg: e.defaultWeight })), ...userEx];

  function addExercise() {
    if (!selectedId) return setStatus("Select an exercise");
    const ex = allExercises.find((e) => e.id === selectedId);
    if (!ex) return;
    setExercises([...exercises, { exerciseId: ex.id, exerciseName: ex.name, sets: exSets || 3, reps: exReps || 10, weightKg: exWeight || 0 }]);
    setSelectedId(""); setExSets(3); setExReps(10); setExWeight(0); setStatus("");
  }

  function removeExercise(idx: number) {
    setExercises(exercises.filter((_, i) => i !== idx));
  }

  function handleSave() {
    if (!name.trim()) return setStatus("Enter a routine name");
    if (!exercises.length) return setStatus("Add at least one exercise");
    createRoutine.mutate(
      { name: name.trim(), goal, daysPerWeek, exercises: exercises.map(({ exerciseName: _, ...re }) => re) },
      { onSuccess: () => router.navigate({ to: "/dashboard" }), onError: () => setStatus("Failed to save") },
    );
  }

  function handleSelectChange(id: string) {
    setSelectedId(id);
    const ex = allExercises.find((e) => e.id === id);
    if (ex) {
      setExSets(ex.defaultSets || 3);
      setExReps(ex.defaultReps || 10);
      setExWeight(ex.defaultWeightKg || 0);
    }
  }

  return (
    <div className="page">
      <h1>New Routine</h1>
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

      {/* Add exercise to routine */}
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

      {/* Current exercises */}
      <div className="card">
        <h2>Routine Exercises</h2>
        {exercises.length === 0 && <p className="hint">No exercises added yet</p>}
        {exercises.map((re, idx) => (
          <div key={idx} className="row-card row-card-flex">
            <div>
              <strong>{re.exerciseName}</strong>
              <span className="hint block">{re.sets}&times;{re.reps} @ {re.weightKg} {units}</span>
            </div>
            <button className="btn-delete" onClick={() => removeExercise(idx)}>Remove</button>
          </div>
        ))}
      </div>

      <button className="btn-primary btn-full" onClick={handleSave} disabled={createRoutine.isPending}>
        {createRoutine.isPending ? "Saving..." : "Save Routine"}
      </button>
      {status && <p className="hint" style={{ marginTop: 8 }}>{status}</p>}
    </div>
  );
}
