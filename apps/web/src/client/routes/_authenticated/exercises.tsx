import { useState, useRef } from "react";
import { useCatalogExercises, useUserExercises, useCreateExercise, useUpdateExercise, useDeleteExercise } from "../../hooks/useExercises";
import { useUnits } from "../../hooks/useProfile";
import type { UserExercise, ExerciseMedia } from "../../types";

const TYPES = ["strength", "cardio", "flexibility", "bodyweight"];
const MUSCLE_GROUPS = ["Quads", "Hamstrings", "Glutes", "Back", "Chest", "Shoulders", "Arms", "Core", "Full Body"];

function toKebab(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ExercisesPage() {
  const units = useUnits();
  const { data: catalog = [] } = useCatalogExercises();
  const { data: userExercises = [] } = useUserExercises();
  const create = useCreateExercise();
  const update = useUpdateExercise();
  const remove = useDeleteExercise();

  // Add form state
  const [name, setName] = useState("");
  const [type, setType] = useState("strength");
  const [muscleGroup, setMuscleGroup] = useState("Quads");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [status, setStatus] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("strength");
  const [editMuscleGroup, setEditMuscleGroup] = useState("Quads");
  const [editSets, setEditSets] = useState(3);
  const [editReps, setEditReps] = useState(10);
  const [editWeight, setEditWeight] = useState(0);
  const [editMedia, setEditMedia] = useState<ExerciseMedia[]>([]);
  const [editStatus, setEditStatus] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    if (!name.trim()) return setStatus("Enter a name");
    create.mutate(
      { id: toKebab(name), name: name.trim(), type, muscleGroup, defaultSets: sets, defaultReps: reps, defaultWeightKg: weight, media: [] },
      {
        onSuccess: () => {
          setName(""); setSets(3); setReps(10); setWeight(0); setStatus("Exercise added!");
        },
        onError: () => setStatus("Failed to add exercise"),
      },
    );
  }

  function startEdit(ex: UserExercise) {
    setEditingId(ex.id);
    setEditName(ex.name);
    setEditType(ex.type);
    setEditMuscleGroup(ex.muscleGroup);
    setEditSets(ex.defaultSets);
    setEditReps(ex.defaultReps);
    setEditWeight(ex.defaultWeightKg);
    setEditMedia(ex.media || []);
    setEditStatus("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditStatus("");
  }

  function handleSaveEdit() {
    if (!editingId || !editName.trim()) return setEditStatus("Name is required");
    update.mutate(
      { id: editingId, name: editName.trim(), type: editType, muscleGroup: editMuscleGroup, defaultSets: editSets, defaultReps: editReps, defaultWeightKg: editWeight, media: editMedia },
      {
        onSuccess: () => { setEditingId(null); setEditStatus(""); },
        onError: () => setEditStatus("Failed to save"),
      },
    );
  }

  async function handleAddMedia(type: "photo" | "video") {
    const input = type === "photo" ? photoInputRef.current : videoInputRef.current;
    if (!input) return;
    input.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>, mediaType: "photo" | "video") {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check: 5MB for photos, 20MB for videos
    const maxSize = mediaType === "photo" ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setEditStatus(`File too large (max ${mediaType === "photo" ? "5MB" : "20MB"})`);
      return;
    }

    const url = await fileToDataUrl(file);
    const newMedia: ExerciseMedia = {
      id: crypto.randomUUID(),
      type: mediaType,
      url,
      caption: "",
    };
    setEditMedia(prev => [...prev, newMedia]);
    e.target.value = "";
  }

  function removeMedia(mediaId: string) {
    setEditMedia(prev => prev.filter(m => m.id !== mediaId));
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
          <div key={ex.id} className={`row-card exercise-card ${editingId === ex.id ? "exercise-card-editing" : ""}`}>
            {editingId === ex.id ? (
              /* ── Edit mode ── */
              <div className="form-stack">
                <input placeholder="Exercise name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <div className="form-row-2">
                  <select value={editType} onChange={(e) => setEditType(e.target.value)}>
                    {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                  <select value={editMuscleGroup} onChange={(e) => setEditMuscleGroup(e.target.value)}>
                    {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-row-3">
                  <input type="number" placeholder="Sets" value={editSets || ""} onChange={(e) => setEditSets(Number(e.target.value))} />
                  <input type="number" placeholder="Reps" value={editReps || ""} onChange={(e) => setEditReps(Number(e.target.value))} />
                  <input type="number" placeholder={`Weight (${units})`} value={editWeight || ""} onChange={(e) => setEditWeight(Number(e.target.value))} />
                </div>

                {/* Media section */}
                <div className="exercise-media-section">
                  <span className="form-label-text">Photos &amp; Videos</span>
                  {editMedia.length > 0 && (
                    <div className="exercise-media-grid">
                      {editMedia.map(m => (
                        <div key={m.id} className="exercise-media-item">
                          {m.type === "photo" ? (
                            <img src={m.url} alt={m.caption || "Exercise photo"} className="exercise-media-thumb" />
                          ) : (
                            <video src={m.url} className="exercise-media-thumb" controls />
                          )}
                          <div className="exercise-media-overlay">
                            <span className="exercise-media-type">{m.type === "photo" ? "Photo" : "Video"}</span>
                            <button className="exercise-media-remove" onClick={() => removeMedia(m.id)} aria-label="Remove">
                              &times;
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="btn-row">
                    <button className="btn-secondary btn-sm" onClick={() => handleAddMedia("photo")} type="button">+ Photo</button>
                    <button className="btn-secondary btn-sm" onClick={() => handleAddMedia("video")} type="button">+ Video</button>
                  </div>
                  <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={(e) => onFileSelected(e, "photo")} />
                  <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={(e) => onFileSelected(e, "video")} />
                </div>

                <div className="btn-row">
                  <button className="btn-primary btn-sm" onClick={handleSaveEdit} disabled={update.isPending} style={{ flex: 1 }}>
                    {update.isPending ? "Saving..." : "Save"}
                  </button>
                  <button className="btn-secondary btn-sm" onClick={cancelEdit} style={{ flex: 1 }}>Cancel</button>
                </div>
                {editStatus && <p className="hint">{editStatus}</p>}
              </div>
            ) : (
              /* ── View mode ── */
              <>
                <div className="row-card-header">
                  <div>
                    <strong>{ex.name}</strong>
                    <span className="hint block">{ex.muscleGroup} · {ex.type} · {ex.defaultSets}&times;{ex.defaultReps} @ {ex.defaultWeightKg} {units}</span>
                  </div>
                </div>
                {ex.media && ex.media.length > 0 && (
                  <div className="exercise-media-grid" style={{ marginTop: 8 }}>
                    {ex.media.map(m => (
                      <div key={m.id} className="exercise-media-item">
                        {m.type === "photo" ? (
                          <img src={m.url} alt={m.caption || "Exercise photo"} className="exercise-media-thumb" />
                        ) : (
                          <video src={m.url} className="exercise-media-thumb" controls />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="btn-row">
                  <button className="btn-edit" onClick={() => startEdit(ex)}>Edit</button>
                  <button className="btn-delete" onClick={() => { if (confirm(`Delete "${ex.name}"?`)) remove.mutate(ex.id); }}>Delete</button>
                </div>
              </>
            )}
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
