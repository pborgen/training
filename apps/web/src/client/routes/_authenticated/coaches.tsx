import { useRouter } from "@tanstack/react-router";
import { useCoaches } from "../../hooks/useCoaches";
import type { CoachListItem } from "../../types";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";
}

function CoachCard({ coach, onOpen }: { coach: CoachListItem; onOpen: () => void }) {
  const accent = coach.accentColor || "var(--accent)";
  return (
    <button
      className="coach-card"
      style={{ ["--coach-accent" as string]: accent }}
      onClick={onOpen}
    >
      <div className="coach-card-glow" />
      <div className="coach-card-avatar">
        {coach.photoUrl
          ? <img src={coach.photoUrl} alt={coach.fullName} />
          : <span>{initials(coach.fullName)}</span>}
      </div>
      <div className="coach-card-body">
        <h3 className="coach-card-name">{coach.fullName || coach.email}</h3>
        <p className="coach-card-tagline">{coach.tagline || "Coach"}</p>
        <div className="coach-chips">
          {coach.specialties.slice(0, 3).map((s) => (
            <span key={s} className="coach-chip">{s}</span>
          ))}
        </div>
      </div>
      <div className="coach-card-foot">
        <span className="coach-years">
          {coach.startingPrice > 0
            ? <>from <strong>${coach.startingPrice}</strong>/mo</>
            : <><strong>{coach.yearsExperience}</strong> yr{coach.yearsExperience === 1 ? "" : "s"} experience</>}
        </span>
        <span className="coach-card-arrow" aria-hidden>→</span>
      </div>
    </button>
  );
}

export function CoachesPage() {
  const router = useRouter();
  const { data: coaches, isLoading } = useCoaches();

  return (
    <div className="page coaches-page">
      <div className="coaches-hero">
        <span className="coaches-eyebrow">The Bench</span>
        <h1>Meet the Coaches</h1>
        <p className="coaches-sub">
          Hand-picked trainers ready to push your programming further. Browse the roster and dive
          into anyone who catches your eye.
        </p>
      </div>

      {isLoading ? (
        <div className="coaches-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: 240 }} />
          ))}
        </div>
      ) : !coaches || coaches.length === 0 ? (
        <div className="empty-state">
          <h3>No coaches yet</h3>
          <p>When coaches publish their spotlight, they'll show up here.</p>
        </div>
      ) : (
        <div className="coaches-grid">
          {coaches.map((coach) => (
            <CoachCard
              key={coach.email}
              coach={coach}
              onOpen={() => router.navigate({ to: "/coaches/$email", params: { email: coach.email } })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
