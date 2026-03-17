import { useState, useMemo } from "react";
import { useKnowledge, useCreateKnowledge, useUpdateKnowledge, useDeleteKnowledge } from "../../hooks/useKnowledge";
import { triggerRagSeed } from "../../api";
import type { KnowledgeChunk } from "../../types";

const CHUNK_TYPES = ["overview", "muscles", "form", "mistakes", "alternatives", "programming"] as const;

const CHUNK_TYPE_LABELS: Record<string, string> = {
  overview: "Overview",
  muscles: "Muscles",
  form: "Form Cues",
  mistakes: "Common Mistakes",
  alternatives: "Alternatives",
  programming: "Programming",
};

const CHUNK_TYPE_COLORS: Record<string, string> = {
  overview: "#3b82f6",
  muscles: "#ef4444",
  form: "#00c896",
  mistakes: "#f59e0b",
  alternatives: "#8b5cf6",
  programming: "#ec4899",
};

export function KnowledgePage() {
  const { data: chunks = [], isLoading } = useKnowledge();
  const create = useCreateKnowledge();
  const update = useUpdateKnowledge();
  const remove = useDeleteKnowledge();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterExercise, setFilterExercise] = useState<string>("all");
  const [editing, setEditing] = useState<KnowledgeChunk | null>(null);
  const [adding, setAdding] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Form state
  const [formExerciseId, setFormExerciseId] = useState("");
  const [formChunkType, setFormChunkType] = useState<string>(CHUNK_TYPES[0]);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");

  // Derived data
  const exerciseIds = useMemo(() => {
    const ids = [...new Set(chunks.map(c => c.exerciseId))].sort();
    return ids;
  }, [chunks]);

  const filtered = useMemo(() => {
    return chunks.filter(c => {
      if (filterType !== "all" && c.chunkType !== filterType) return false;
      if (filterExercise !== "all" && c.exerciseId !== filterExercise) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q) || c.exerciseId.toLowerCase().includes(q);
      }
      return true;
    });
  }, [chunks, filterType, filterExercise, search]);

  // Group by exercise
  const grouped = useMemo(() => {
    const map: Record<string, KnowledgeChunk[]> = {};
    for (const c of filtered) {
      if (!map[c.exerciseId]) map[c.exerciseId] = [];
      map[c.exerciseId].push(c);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  function startEdit(chunk: KnowledgeChunk) {
    setEditing(chunk);
    setFormTitle(chunk.title);
    setFormContent(chunk.content);
    setAdding(false);
  }

  function startAdd() {
    setAdding(true);
    setEditing(null);
    setFormExerciseId("");
    setFormChunkType(CHUNK_TYPES[0]);
    setFormTitle("");
    setFormContent("");
  }

  function cancelForm() {
    setEditing(null);
    setAdding(false);
  }

  function handleSave() {
    if (editing) {
      update.mutate({ id: editing.id, title: formTitle, content: formContent }, { onSuccess: () => setEditing(null) });
    } else if (adding) {
      create.mutate({ exerciseId: formExerciseId, chunkType: formChunkType, title: formTitle, content: formContent }, { onSuccess: () => setAdding(false) });
    }
  }

  function handleDelete(chunk: KnowledgeChunk) {
    if (confirm(`Delete "${chunk.title}"? This cannot be undone.`)) {
      remove.mutate(chunk.id);
    }
  }

  async function handleReseed() {
    if (!confirm("Re-seed the knowledge base from the built-in exercise corpus? This will overwrite any matching chunks.")) return;
    setSeeding(true);
    try {
      await triggerRagSeed();
      window.location.reload();
    } catch {
      setSeeding(false);
    }
  }

  function toggleExpanded(exerciseId: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }

  function formatExerciseName(id: string) {
    return id.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  if (isLoading) return (
    <div className="skeleton-page">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card-sm" />
    </div>
  );

  const isSaving = create.isPending || update.isPending;

  return (
    <div className="page">
      <div className="knowledge-header">
        <div>
          <h1>Knowledge Base</h1>
          <p className="hint">{chunks.length} chunks across {exerciseIds.length} exercises</p>
        </div>
        <div className="knowledge-header-actions">
          <button className="btn-secondary btn-sm" onClick={handleReseed} disabled={seeding}>
            {seeding ? "Seeding..." : "Re-seed"}
          </button>
          <button className="btn-primary btn-sm" onClick={startAdd}>+ Add Chunk</button>
        </div>
      </div>

      {/* Filters */}
      <div className="knowledge-filters">
        <input
          type="text"
          placeholder="Search chunks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="knowledge-search"
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All types</option>
          {CHUNK_TYPES.map(t => (
            <option key={t} value={t}>{CHUNK_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select value={filterExercise} onChange={e => setFilterExercise(e.target.value)}>
          <option value="all">All exercises</option>
          {exerciseIds.map(id => (
            <option key={id} value={id}>{formatExerciseName(id)}</option>
          ))}
        </select>
      </div>

      {/* Add/Edit form */}
      {(adding || editing) && (
        <div className="card knowledge-form">
          <h3>{editing ? `Edit: ${editing.title}` : "Add Knowledge Chunk"}</h3>
          <div className="form-stack">
            {adding && (
              <>
                <label className="form-label">
                  <span className="form-label-text">Exercise ID</span>
                  <input
                    value={formExerciseId}
                    onChange={e => setFormExerciseId(e.target.value)}
                    placeholder="e.g. barbell-back-squat"
                  />
                </label>
                <label className="form-label">
                  <span className="form-label-text">Chunk Type</span>
                  <select value={formChunkType} onChange={e => setFormChunkType(e.target.value)}>
                    {CHUNK_TYPES.map(t => (
                      <option key={t} value={t}>{CHUNK_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label className="form-label">
              <span className="form-label-text">Title</span>
              <input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Chunk title"
              />
            </label>
            <label className="form-label">
              <span className="form-label-text">Content</span>
              <textarea
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                placeholder="Knowledge content..."
                rows={8}
                className="knowledge-textarea"
              />
            </label>
            <div className="modal-actions">
              <button className="btn-secondary btn-sm" onClick={cancelForm}>Cancel</button>
              <button
                className="btn-primary btn-sm"
                onClick={handleSave}
                disabled={isSaving || !formTitle.trim() || !formContent.trim() || (adding && !formExerciseId.trim())}
              >
                {isSaving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge chunks grouped by exercise */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: "var(--muted)", fontSize: 16 }}>
            {chunks.length === 0 ? "No knowledge chunks yet. Seed the knowledge base or add chunks manually." : "No chunks match your filters."}
          </p>
        </div>
      ) : (
        grouped.map(([exerciseId, exChunks]) => {
          const isOpen = expanded.has(exerciseId);
          return (
            <div key={exerciseId} className="knowledge-group">
              <button className="knowledge-group-header" onClick={() => toggleExpanded(exerciseId)}>
                <div className="knowledge-group-title">
                  <span className="knowledge-chevron" style={{ transform: isOpen ? "rotate(90deg)" : undefined }}>&#9654;</span>
                  <strong>{formatExerciseName(exerciseId)}</strong>
                  <span className="hint">{exChunks.length} chunk{exChunks.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="knowledge-group-types">
                  {exChunks.map(c => (
                    <span
                      key={c.id}
                      className="knowledge-type-dot"
                      style={{ background: CHUNK_TYPE_COLORS[c.chunkType] || "var(--muted)" }}
                      title={CHUNK_TYPE_LABELS[c.chunkType]}
                    />
                  ))}
                </div>
              </button>
              {isOpen && (
                <div className="knowledge-group-body">
                  {exChunks.map(chunk => (
                    <div key={chunk.id} className="knowledge-chunk">
                      <div className="knowledge-chunk-header">
                        <span
                          className="knowledge-type-badge"
                          style={{ background: (CHUNK_TYPE_COLORS[chunk.chunkType] || "var(--muted)") + "22", color: CHUNK_TYPE_COLORS[chunk.chunkType] || "var(--muted)" }}
                        >
                          {CHUNK_TYPE_LABELS[chunk.chunkType] || chunk.chunkType}
                        </span>
                        <strong className="knowledge-chunk-title">{chunk.title}</strong>
                        <div className="knowledge-chunk-actions">
                          <button className="btn-link-sm" onClick={() => startEdit(chunk)}>Edit</button>
                          <button className="btn-link-sm danger" onClick={() => handleDelete(chunk)}>Delete</button>
                        </div>
                      </div>
                      <pre className="knowledge-chunk-content">{chunk.content}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
