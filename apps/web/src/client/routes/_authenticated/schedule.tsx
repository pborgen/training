import { useState, useEffect, useCallback } from "react";
import { fetchMySchedule, createMySchedule, deleteMySchedule, fetchClientPermissions } from "../../api";
import { useRoutines } from "../../hooks/useRoutines";
import type { ScheduledWorkout } from "../../types";

type View = "week" | "month";

function weekStart(d: Date) {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  return s;
}
function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function monthEnd(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function daysInMonthGrid(d: Date): Date[] {
  const start = monthStart(d);
  const end = monthEnd(d);
  const days: Date[] = [];
  for (let i = start.getDay() - 1; i >= 0; i--) {
    const pd = new Date(start);
    pd.setDate(pd.getDate() - i - 1);
    days.push(pd);
  }
  for (let i = 1; i <= end.getDate(); i++) {
    days.push(new Date(d.getFullYear(), d.getMonth(), i));
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    const nd = new Date(last);
    nd.setDate(nd.getDate() + 1);
    days.push(nd);
  }
  return days;
}

export function SchedulePage() {
  const [view, setView] = useState<View>("week");
  const [weekOf, setWeekOf] = useState(weekStart(new Date()));
  const [month, setMonth] = useState(new Date());
  const [workouts, setWorkouts] = useState<ScheduledWorkout[]>([]);
  const [canSelfSchedule, setCanSelfSchedule] = useState(true);
  const { data: routines = [] } = useRoutines();

  // Assign form
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [formRoutine, setFormRoutine] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClientPermissions().then(p => setCanSelfSchedule(p.clientSelfSchedule)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    let from: string, to: string;
    if (view === "week") {
      from = fmt(weekOf);
      to = fmt(addDays(weekOf, 6));
    } else {
      from = fmt(monthStart(month));
      to = fmt(monthEnd(month));
    }
    const data = await fetchMySchedule(from, to);
    setWorkouts(data);
  }, [view, weekOf, month]);

  useEffect(() => { load(); }, [load]);

  const today = fmt(new Date());

  // Group by date
  const byDate: Record<string, ScheduledWorkout[]> = {};
  for (const w of workouts) {
    const d = w.scheduledDate.slice(0, 10);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(w);
  }

  // Week navigation
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekOf, i));
  const weekLabel = `${weekOf.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${addDays(weekOf, 6).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  function prevWeek() { setWeekOf(addDays(weekOf, -7)); }
  function nextWeek() { setWeekOf(addDays(weekOf, 7)); }

  // Month navigation
  const monthDays = daysInMonthGrid(month);
  const currentMonth = month.getMonth();
  function prevMonth() { setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)); }
  function nextMonth() { setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)); }

  function goToday() {
    if (view === "week") setWeekOf(weekStart(new Date()));
    else setMonth(new Date());
  }

  // Selected day in month view
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function openAssignForm(date: string) {
    if (!canSelfSchedule) return;
    setFormDate(date);
    setFormRoutine("");
    setFormNotes("");
    setShowForm(true);
  }

  async function handleAssign() {
    if (!formRoutine || !formDate) return;
    const routine = routines.find(r => r.id === formRoutine);
    if (!routine) return;
    setSaving(true);
    await createMySchedule({ routineId: routine.id, routineName: routine.name, scheduledDate: formDate, notes: formNotes });
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function handleRemove(id: string) {
    await deleteMySchedule(id);
    load();
  }

  // Helper to render a workout card for a day with optional remove button
  function renderDayWorkouts(dayWorkouts: ScheduledWorkout[], dateKey: string) {
    const isSelf = canSelfSchedule;
    return (
      <>
        {dayWorkouts.length === 0 ? (
          <p className="hint" style={{ marginTop: 6 }}>Rest day</p>
        ) : (
          dayWorkouts.map(w => (
            <div key={w.id} className="row-card" style={{ marginTop: 8 }}>
              <div className="row-card-flex">
                <div>
                  <strong>{w.routineName}</strong>
                  {w.notes && <span className="hint block">{w.notes}</span>}
                </div>
                {isSelf && w.createdBy === w.clientEmail && (
                  <button className="btn-delete" onClick={() => handleRemove(w.id)}>Remove</button>
                )}
              </div>
            </div>
          ))
        )}
        {isSelf && (
          <button className="btn-link" onClick={() => openAssignForm(dateKey)} style={{ marginTop: 6, fontSize: 12, color: "var(--accent)" }}>
            + Add workout
          </button>
        )}
      </>
    );
  }

  return (
    <div className="page">
      <h1>My Schedule</h1>

      {/* View toggle */}
      <div className="unit-toggle">
        <button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Week</button>
        <button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Month</button>
      </div>

      {/* Navigation header */}
      <div className="card">
        <div className="calendar-header">
          <button className="btn-icon" onClick={view === "week" ? prevWeek : prevMonth} aria-label="Previous">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ textAlign: "center" }}>
            <span className="calendar-month-label">{view === "week" ? weekLabel : monthLabel(month)}</span>
            <button className="btn-link" onClick={goToday} style={{ display: "block", margin: "4px auto 0", fontSize: 12 }}>Today</button>
          </div>
          <button className="btn-icon" onClick={view === "week" ? nextWeek : nextMonth} aria-label="Next">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* Month grid (inside the card) */}
        {view === "month" && (
          <>
            <div className="calendar-weekdays">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="calendar-weekday">{d}</div>
              ))}
            </div>
            <div className="calendar-grid">
              {monthDays.map((day, i) => {
                const key = fmt(day);
                const isCurrentMonth = day.getMonth() === currentMonth;
                const isToday = key === today;
                const dayWorkouts = byDate[key] || [];
                const isSelected = key === selectedDate;
                return (
                  <div
                    key={i}
                    className={`calendar-day ${!isCurrentMonth ? "other-month" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                    onClick={() => isCurrentMonth && setSelectedDate(isSelected ? null : key)}
                  >
                    <span className="calendar-day-num">{day.getDate()}</span>
                    {dayWorkouts.length > 0 && (
                      <div className="calendar-event">
                        <span className="calendar-event-dot" />
                        <span className="calendar-event-text">
                          {dayWorkouts.length} workout{dayWorkouts.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Month view: selected day detail */}
      {view === "month" && selectedDate && (
        <div className={`card schedule-day-card ${selectedDate === today ? "schedule-today" : ""}`}>
          <div className="schedule-day-header">
            <span className={`schedule-day-label ${selectedDate === today ? "accent" : ""}`}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </span>
            {selectedDate === today && <span className="badge">Today</span>}
          </div>
          {renderDayWorkouts(byDate[selectedDate] || [], selectedDate)}
        </div>
      )}

      {/* Week view: day cards */}
      {view === "week" && weekDays.map(day => {
        const key = fmt(day);
        const isToday = key === today;
        const dayLabel = day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
        return (
          <div key={key} className={`card schedule-day-card ${isToday ? "schedule-today" : ""}`}>
            <div className="schedule-day-header">
              <span className={`schedule-day-label ${isToday ? "accent" : ""}`}>{dayLabel}</span>
              {isToday && <span className="badge">Today</span>}
            </div>
            {renderDayWorkouts(byDate[key] || [], key)}
          </div>
        );
      })}

      {/* Assign workout modal */}
      {showForm && (
        <>
          <div className="modal-overlay" onClick={() => setShowForm(false)} />
          <div className="modal">
            <h3>Add Workout</h3>
            <p className="modal-subtitle">
              {formDate && new Date(formDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <div className="form-stack">
              <label className="form-label">
                <span className="form-label-text">Routine</span>
                <select value={formRoutine} onChange={e => setFormRoutine(e.target.value)}>
                  <option value="">Select a routine...</option>
                  {routines.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
              <label className="form-label">
                <span className="form-label-text">Notes (optional)</span>
                <input value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="e.g. Go heavy today" />
              </label>
              <div className="modal-actions">
                <button className="btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn-primary btn-sm" onClick={handleAssign} disabled={!formRoutine || saving}>
                  {saving ? "Saving..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
