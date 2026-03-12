import { useState } from "react";
import { useCatalogExercises, useUserExercises, useCreateExercise, useDeleteExercise } from "../../hooks/useExercises";
import { useUnits } from "../../hooks/useProfile";

const TYPES = ["strength", "cardio", "flexibility", "bodyweight"];
const MUSCLE_GROUPS = ["Quads", "Hamstrings", "Glutes", "Back", "Chest", "Shoulders", "Arms", "Core", "Full Body"];

function toKebab(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export function ExercisesPage() {
  const units = useUnits();
  const { data: catalog = [] } = useCatalogExercises();
  const { data: userExercises = [] } = useUserExercises();
  const create = useCreateExercise();
  const remove = useDeleteExercise();

  const [name, setName] = useState("");
  const [type, setType] = useState("strength");
  const [muscleGroup, setMuscleGroup] = useState("Quads");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [status, setStatus] = useState("");

  function handleAdd() {
    if (!name.trim()) return setStatus("Enter a name");
    create.mutate(
      { id: toKebab(name), name: name.trim(), type, muscleGroup, defaultSets: sets, defaultReps: reps, defaultWeightKg: weight },
      {
        onSuccess: () => {
          setName(""); setSets(3); setReps(10); setWeight(0); setStatus("Exercise added!");
        },
        onError: () => setStatus("Failed to add exercise"),
      },
    );
  }

  return (
    <div className="page">
      <h1>Exercises</h1>

      {/* Add form */}
      <div className="card">
        <h2>Add Exercise</h2>
        <div className="form-stack">
          <input placeholder="Exercise name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="form-row-2">
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <select value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)}>
              {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-row-3">
            <input type="number" placeholder="Sets" value={sets || ""} onChange={(e) => setSets(Number(e.target.value))} />
            <input type="number" placeholder="Reps" value={reps || ""} onChange={(e) => setReps(Number(e.target.value))} />
            <input type="number" placeholder={`Weight (${units})`} value={weight || ""} onChange={(e) => setWeight(Number(e.target.value))} />
          </div>
          <button className="btn-primary" onClick={handleAdd} disabled={create.isPending}>Add Exercise</button>
          {status && <p className="hint">{status}</p>}
        </div>
      </div>

      {/* My Exercises */}
      <div className="card">
        <h2>My Exercises</h2>
        {userExercises.length === 0 && <p className="hint">No custom exercises yet</p>}
        {userExercises.map((ex) => (
          <div key={ex.id} className="row-card">
            <strong>{ex.name}</strong>
            <span className="hint block">{ex.muscleGroup} · {ex.type} · {ex.defaultSets}&times;{ex.defaultReps} @ {ex.defaultWeightKg} {units}</span>
            <div className="btn-row">
              <button className="btn-delete" onClick={() => { if (confirm(`Delete "${ex.name}"?`)) remove.mutate(ex.id); }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Catalog */}
      <div className="card">
        <h2>Exercise Catalog</h2>
        {catalog.map((ex) => (
          <div key={ex.id} className="row-card">
            <strong>{ex.name}</strong>
            <span className="hint block">{ex.muscleGroup} · {ex.category} · {ex.defaultSets}&times;{ex.defaultReps} @ {ex.defaultWeight} lbs</span>
          </div>
        ))}
      </div>
    </div>
  );
}
