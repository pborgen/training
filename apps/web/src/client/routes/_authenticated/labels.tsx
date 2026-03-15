import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLabels, createLabelApi, updateLabelApi, deleteLabelApi, type Label } from "../../api";

const PRESET_COLORS = ["#00c896", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export function LabelsPage() {
  const qc = useQueryClient();
  const { data: labels = [], isLoading } = useQuery({ queryKey: ["labels"], queryFn: fetchLabels });
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editing, setEditing] = useState<Label | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const addLabel = useMutation({
    mutationFn: () => createLabelApi(newName.trim(), newColor),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["labels"] }); setNewName(""); },
  });

  const editLabel = useMutation({
    mutationFn: () => updateLabelApi(editing!.id, editName.trim(), editColor),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["labels"] }); setEditing(null); },
  });

  const removeLabel = useMutation({
    mutationFn: (id: string) => deleteLabelApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels"] }),
  });

  function startEdit(label: Label) {
    setEditing(label);
    setEditName(label.name);
    setEditColor(label.color);
  }

  if (isLoading) return <div className="page"><p>Loading labels...</p></div>;

  return (
    <div className="page">
      <h1>Labels</h1>
      <p style={{ color: "var(--muted)", marginBottom: 20 }}>Create labels to organize and group your clients.</p>

      {/* Create new label */}
      <div className="label-form">
        <input
          type="text"
          placeholder="Label name (e.g. Varsity, U16, Morning)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="label-input"
          onKeyDown={e => e.key === "Enter" && newName.trim() && addLabel.mutate()}
        />
        <div className="color-picker">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              className={`color-swatch ${newColor === c ? "selected" : ""}`}
              style={{ background: c }}
              onClick={() => setNewColor(c)}
            />
          ))}
        </div>
        <button
          className="btn-primary"
          disabled={!newName.trim() || addLabel.isPending}
          onClick={() => addLabel.mutate()}
        >
          {addLabel.isPending ? "Adding..." : "Add Label"}
        </button>
      </div>

      {/* Existing labels */}
      <div className="labels-list">
        {labels.length === 0 && <p style={{ color: "var(--muted)" }}>No labels yet. Create one above.</p>}
        {labels.map(label => (
          <div key={label.id} className="label-list-item">
            {editing?.id === label.id ? (
              <div className="label-edit-form">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="label-input"
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && editName.trim() && editLabel.mutate()}
                />
                <div className="color-picker">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      className={`color-swatch ${editColor === c ? "selected" : ""}`}
                      style={{ background: c }}
                      onClick={() => setEditColor(c)}
                    />
                  ))}
                </div>
                <div className="label-edit-actions">
                  <button className="btn-primary btn-sm" onClick={() => editLabel.mutate()} disabled={!editName.trim()}>Save</button>
                  <button className="btn-secondary btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <span className="label-badge" style={{ background: label.color + "22", color: label.color, borderColor: label.color }}>
                  {label.name}
                </span>
                <div className="label-item-actions">
                  <button className="btn-link-sm" onClick={() => startEdit(label)}>Edit</button>
                  <button className="btn-link-sm danger" onClick={() => removeLabel.mutate(label.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
