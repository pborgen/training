import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllUsers, fetchLabels, fetchUserLabels, setUserLabelsApi, type AdminUser, type Label } from "../../api";

export function UsersPage() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: fetchAllUsers });
  const { data: labels = [] } = useQuery({ queryKey: ["labels"], queryFn: fetchLabels });
  const { data: userLabelsMap = {} } = useQuery({ queryKey: ["user-labels"], queryFn: fetchUserLabels });
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [filterLabel, setFilterLabel] = useState<string>("");
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState<string>("");

  const saveLabels = useMutation({
    mutationFn: ({ email, labelIds }: { email: string; labelIds: string[] }) => setUserLabelsApi(email, labelIds),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["user-labels"] }); setEditingEmail(null); },
  });

  function startEditLabels(email: string) {
    setEditingEmail(email);
    setSelectedLabels((userLabelsMap[email] || []).map(l => l.id));
  }

  function toggleLabel(labelId: string) {
    setSelectedLabels(prev => prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]);
  }

  if (isLoading) return <div className="page"><p>Loading users...</p></div>;

  const admins = users.filter(u => u.role === "admin");
  let clients = users.filter(u => u.role !== "admin");

  // Filters
  if (search) {
    const q = search.toLowerCase();
    clients = clients.filter(u =>
      (u.fullName || "").toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }
  if (filterLabel) {
    clients = clients.filter(u => (userLabelsMap[u.email] || []).some(l => l.id === filterLabel));
  }
  if (filterGender) {
    clients = clients.filter(u => u.gender === filterGender);
  }

  const genders = [...new Set(users.filter(u => u.role !== "admin" && u.gender).map(u => u.gender))];
  const hasActiveFilters = !!search || !!filterLabel || !!filterGender;

  return (
    <div className="page">
      <h1>Users</h1>

      {/* Filters */}
      <div className="users-filters">
        <input
          className="filter-search"
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="filter-row">
          {labels.length > 0 && (
            <div className="label-filter">
              <button
                className={`label-filter-btn ${!filterLabel ? "active" : ""}`}
                onClick={() => setFilterLabel("")}
              >All</button>
              {labels.map(l => (
                <button
                  key={l.id}
                  className={`label-filter-btn ${filterLabel === l.id ? "active" : ""}`}
                  style={filterLabel === l.id ? { background: l.color + "22", color: l.color, borderColor: l.color } : {}}
                  onClick={() => setFilterLabel(filterLabel === l.id ? "" : l.id)}
                >
                  <span className="label-dot" style={{ background: l.color }} />
                  {l.name}
                </button>
              ))}
            </div>
          )}
          {genders.length > 0 && (
            <div className="label-filter">
              <button
                className={`label-filter-btn ${!filterGender ? "active" : ""}`}
                onClick={() => setFilterGender("")}
              >All Genders</button>
              {genders.map(g => (
                <button
                  key={g}
                  className={`label-filter-btn ${filterGender === g ? "active" : ""}`}
                  onClick={() => setFilterGender(filterGender === g ? "" : g)}
                >{g}</button>
              ))}
            </div>
          )}
          {hasActiveFilters && (
            <button
              className="btn-link-sm"
              onClick={() => { setSearch(""); setFilterLabel(""); setFilterGender(""); }}
            >Clear filters</button>
          )}
        </div>
      </div>

      {admins.length > 0 && !hasActiveFilters && (
        <section className="users-section">
          <h2>Admins</h2>
          <div className="users-grid">
            {admins.map(u => (
              <UserCard key={u.email} user={u} labels={userLabelsMap[u.email] || []} onEditLabels={() => startEditLabels(u.email)} />
            ))}
          </div>
        </section>
      )}

      <section className="users-section">
        <h2>Clients ({clients.length})</h2>
        <div className="users-grid">
          {clients.map(u => (
            <UserCard key={u.email} user={u} labels={userLabelsMap[u.email] || []} onEditLabels={() => startEditLabels(u.email)} />
          ))}
          {clients.length === 0 && <p style={{ color: "var(--muted)" }}>No clients match this filter.</p>}
        </div>
      </section>

      {/* Label assignment modal */}
      {editingEmail && (
        <>
          <div className="modal-overlay" onClick={() => setEditingEmail(null)} />
          <div className="modal">
            <h3>Assign Labels</h3>
            <p className="modal-subtitle">{users.find(u => u.email === editingEmail)?.fullName || editingEmail}</p>
            <div className="label-checklist">
              {labels.length === 0 && <p style={{ color: "var(--muted)" }}>No labels created yet. Go to Labels to create some.</p>}
              {labels.map(l => (
                <label key={l.id} className="label-check-item">
                  <input
                    type="checkbox"
                    checked={selectedLabels.includes(l.id)}
                    onChange={() => toggleLabel(l.id)}
                  />
                  <span className="label-badge" style={{ background: l.color + "22", color: l.color, borderColor: l.color }}>
                    {l.name}
                  </span>
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditingEmail(null)}>Cancel</button>
              <button
                className="btn-primary"
                disabled={saveLabels.isPending}
                onClick={() => saveLabels.mutate({ email: editingEmail, labelIds: selectedLabels })}
              >
                {saveLabels.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserCard({ user, labels, onEditLabels }: { user: AdminUser; labels: Label[]; onEditLabels: () => void }) {
  const initials = (user.fullName || user.username).split(" ").map(w => w[0]?.toUpperCase()).join("").slice(0, 2) || "?";
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—";

  return (
    <div className="user-card">
      <div className="user-avatar">{initials}</div>
      <div className="user-info">
        <span className="user-name">{user.fullName || user.username}</span>
        <span className="user-email-detail">{user.email}</span>
        <div className="user-meta">
          <span className={`user-role-badge ${user.role}`}>{user.role}</span>
          {user.age > 0 && <span>Age {user.age}</span>}
          {user.gender && <span>{user.gender}</span>}
          <span>Joined {joined}</span>
        </div>
        {labels.length > 0 && (
          <div className="user-labels">
            {labels.map(l => (
              <span key={l.id} className="label-badge-sm" style={{ background: l.color + "22", color: l.color, borderColor: l.color }}>
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <button className="btn-icon" onClick={onEditLabels} title="Edit labels">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
      </button>
    </div>
  );
}
