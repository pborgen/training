import { useState, useEffect, useCallback } from "react";
import {
  fetchScheduledWorkoutsAdmin,
  createScheduledWorkoutApi,
  deleteScheduledWorkoutApi,
  fetchAllUsers,
  fetchAllRoutinesAdmin,
  fetchAdminSetting,
  updateAdminSetting,
  type AdminUser,
} from "../../api";
import type { ScheduledWorkout, AdminRoutine } from "../../types";

function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function monthEnd(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}
function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function daysInMonth(d: Date): Date[] {
  const start = monthStart(d);
  const end = monthEnd(d);
  const days: Date[] = [];
  // Pad with days from previous month to start on Sunday
  const startDay = start.getDay();
  for (let i = startDay - 1; i >= 0; i--) {
    const pd = new Date(start);
    pd.setDate(pd.getDate() - i - 1);
    days.push(pd);
  }
  for (let i = 1; i <= end.getDate(); i++) {
    days.push(new Date(d.getFullYear(), d.getMonth(), i));
  }
  // Pad to fill last week
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    const nd = new Date(last);
    nd.setDate(nd.getDate() + 1);
    days.push(nd);
  }
  return days;
}

export function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [workouts, setWorkouts] = useState<ScheduledWorkout[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [routines, setRoutines] = useState<AdminRoutine[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formClient, setFormClient] = useState("");
  const [formRoutine, setFormRoutine] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [clientSelfSchedule, setClientSelfSchedule] = useState(true);
  const [togglingSchedule, setTogglingSchedule] = useState(false);

  useEffect(() => {
    fetchAdminSetting("client_self_schedule").then(s => {
      setClientSelfSchedule(s.value !== "false");
    }).catch(() => {});
  }, []);

  async function toggleSelfSchedule() {
    setTogglingSchedule(true);
    const newVal = !clientSelfSchedule;
    await updateAdminSetting("client_self_schedule", String(newVal));
    setClientSelfSchedule(newVal);
    setTogglingSchedule(false);
  }

  const loadWorkouts = useCallback(async () => {
    const from = fmt(monthStart(month));
    const to = fmt(monthEnd(month));
    const data = await fetchScheduledWorkoutsAdmin(from, to);
    setWorkouts(data);
  }, [month]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  useEffect(() => {
    fetchAllUsers().then(setUsers);
    fetchAllRoutinesAdmin().then(setRoutines);
  }, []);

  const days = daysInMonth(month);
  const today = fmt(new Date());
  const currentMonth = month.getMonth();

  function prevMonth() {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }
  function nextMonth() {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  function openForm(date: string) {
    setSelectedDate(date);
    setFormClient("");
    setFormRoutine("");
    setFormNotes("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!formClient || !formRoutine || !selectedDate) return;
    const routine = routines.find(r => r.id === formRoutine);
    if (!routine) return;
    setSaving(true);
    await createScheduledWorkoutApi({
      clientEmail: formClient,
      routineId: routine.id,
      routineName: routine.name,
      scheduledDate: selectedDate,
      notes: formNotes,
    });
    setSaving(false);
    setShowForm(false);
    loadWorkouts();
  }

  async function handleDelete(id: string) {
    await deleteScheduledWorkoutApi(id);
    loadWorkouts();
  }

  // Group workouts by date
  const byDate: Record<string, ScheduledWorkout[]> = {};
  for (const w of workouts) {
    const d = w.scheduledDate.slice(0, 10);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(w);
  }

  // Get unique clients for filter
  const clients = users.filter(u => u.role === "client");

  // Get routines for selected client
  const clientRoutines = formClient
    ? routines.filter(r => r.email === formClient)
    : [];

  return (
    <div className="page">
      <h1>Calendar</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row-card-flex" style={{ alignItems: "center" }}>
          <div>
            <strong>Client Self-Scheduling</strong>
            <span className="hint block">Allow clients to add workouts to their own schedule</span>
          </div>
          <button
            className={`toggle-btn ${clientSelfSchedule ? "active" : ""}`}
            onClick={toggleSelfSchedule}
            disabled={togglingSchedule}
            aria-label="Toggle client self-scheduling"
          >
            <span className="toggle-knob" />
          </button>
        </div>
      </div>

      <div className="card">
        <div className="calendar-header">
          <button className="btn-icon" onClick={prevMonth} aria-label="Previous month">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="calendar-month-label">{monthLabel(month)}</span>
          <button className="btn-icon" onClick={nextMonth} aria-label="Next month">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        <div className="calendar-weekdays">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="calendar-weekday">{d}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {days.map((day, i) => {
            const key = fmt(day);
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = key === today;
            const dayWorkouts = byDate[key] || [];
            return (
              <div
                key={i}
                className={`calendar-day ${!isCurrentMonth ? "other-month" : ""} ${isToday ? "today" : ""}`}
                onClick={() => isCurrentMonth && openForm(key)}
              >
                <span className="calendar-day-num">{day.getDate()}</span>
                {dayWorkouts.slice(0, 3).map(w => (
                  <div key={w.id} className="calendar-event" title={`${w.clientName || w.clientEmail}: ${w.routineName}`}>
                    <span className="calendar-event-dot" />
                    <span className="calendar-event-text">
                      {(w.clientName || w.clientEmail.split("@")[0])} — {w.routineName}
                    </span>
                  </div>
                ))}
                {dayWorkouts.length > 3 && (
                  <div className="calendar-event-more">+{dayWorkouts.length - 3} more</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail — show when a date is selected */}
      {selectedDate && (
        <div className="card">
          <div className="calendar-day-detail-header">
            <h2>{new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h2>
            <button className="btn-edit" onClick={() => openForm(selectedDate)}>+ Assign</button>
          </div>
          {(byDate[selectedDate] || []).length === 0 && (
            <p className="hint" style={{ marginTop: 8 }}>No workouts scheduled for this day.</p>
          )}
          {(byDate[selectedDate] || []).map(w => (
            <div key={w.id} className="row-card" style={{ marginTop: 8 }}>
              <div className="row-card-flex">
                <div>
                  <strong>{w.clientName || w.clientEmail}</strong>
                  <span className="hint block">{w.routineName}</span>
                  {w.notes && <span className="hint block">{w.notes}</span>}
                </div>
                <button className="btn-delete" onClick={() => handleDelete(w.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment modal */}
      {showForm && (
        <>
          <div className="modal-overlay" onClick={() => setShowForm(false)} />
          <div className="modal">
            <h3>Assign Workout</h3>
            <p className="modal-subtitle">
              {selectedDate && new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <div className="form-stack">
              <label className="form-label">
                <span className="form-label-text">Client</span>
                <select value={formClient} onChange={e => { setFormClient(e.target.value); setFormRoutine(""); }}>
                  <option value="">Select a client...</option>
                  {clients.map(u => (
                    <option key={u.email} value={u.email}>
                      {u.fullName || u.username} ({u.email})
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-label">
                <span className="form-label-text">Routine</span>
                <select value={formRoutine} onChange={e => setFormRoutine(e.target.value)} disabled={!formClient}>
                  <option value="">{formClient ? "Select a routine..." : "Select a client first"}</option>
                  {clientRoutines.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
              <label className="form-label">
                <span className="form-label-text">Notes (optional)</span>
                <input value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="e.g. Focus on form today" />
              </label>
              <div className="modal-actions">
                <button className="btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn-primary btn-sm" onClick={handleSave} disabled={!formClient || !formRoutine || saving}>
                  {saving ? "Saving..." : "Assign"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
