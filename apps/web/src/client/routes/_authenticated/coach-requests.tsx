import { useCoachRequests, useUpdateCoachRequest } from "../../hooks/useCoaches";
import type { CoachingRequest } from "../../types";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
  catch { return ""; }
}

function RequestCard({ req }: { req: CoachingRequest }) {
  const update = useUpdateCoachRequest();
  const busy = update.isPending;

  return (
    <div className={`card request-card status-${req.status}`}>
      <div className="request-head">
        <div className="request-avatar">
          {req.clientPhoto ? <img src={req.clientPhoto} alt={req.clientName} /> : <span>{initials(req.clientName || req.clientEmail)}</span>}
        </div>
        <div className="request-who">
          <strong>{req.clientName || req.clientEmail}</strong>
          <span className="request-meta">{req.clientEmail}</span>
        </div>
        <span className={`request-status-pill status-${req.status}`}>{req.status}</span>
      </div>

      <div className="request-body">
        {req.planName && <span className="request-plan">Plan: <strong>{req.planName}</strong></span>}
        <span className="request-date">{fmtDate(req.createdAt)}</span>
      </div>

      {req.message && <p className="request-message">“{req.message}”</p>}

      {req.status === "pending" && (
        <div className="request-actions">
          <button className="btn-primary" disabled={busy} onClick={() => update.mutate({ id: req.id, status: "accepted" })}>Accept</button>
          <button className="btn-secondary" disabled={busy} onClick={() => update.mutate({ id: req.id, status: "declined" })}>Decline</button>
        </div>
      )}
      {req.status === "accepted" && (
        <a className="request-contact" href={`mailto:${req.clientEmail}`}>Email {req.clientName?.split(" ")[0] || "client"} →</a>
      )}
    </div>
  );
}

export function CoachRequestsPage() {
  const { data: requests, isLoading } = useCoachRequests();
  const pending = (requests || []).filter((r) => r.status === "pending");

  return (
    <div className="page coach-requests-page">
      <div className="coaches-hero">
        <span className="coaches-eyebrow">Inbox</span>
        <h1>Coaching Requests</h1>
        <p className="coaches-sub">
          Athletes who picked you from the showcase. Accept to start the conversation.
          {pending.length > 0 && <> You have <strong>{pending.length}</strong> waiting.</>}
        </p>
      </div>

      {isLoading ? (
        <div className="coaches-grid">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton-card" style={{ height: 160 }} />)}
        </div>
      ) : !requests || requests.length === 0 ? (
        <div className="empty-state">
          <h3>No requests yet</h3>
          <p>When athletes pick you from the coach showcase, they'll appear here. Make sure your spotlight is published.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((r) => <RequestCard key={r.id} req={r} />)}
        </div>
      )}
    </div>
  );
}
