import { useRouter, useParams } from "@tanstack/react-router";
import { useCoach } from "../../hooks/useCoaches";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";
}

function SocialLink({ label, href, icon }: { label: string; href: string; icon: string }) {
  return (
    <a className="coach-social" href={href} target="_blank" rel="noopener noreferrer">
      <span className="coach-social-icon" aria-hidden>{icon}</span>
      {label}
    </a>
  );
}

export function CoachDetailPage() {
  const router = useRouter();
  const { email } = useParams({ strict: false }) as { email: string };
  const { data: coach, isLoading, isError } = useCoach(email);

  if (isLoading) {
    return (
      <div className="page">
        <div className="skeleton skeleton-card" style={{ height: 260 }} />
        <div className="skeleton skeleton-card" style={{ height: 160 }} />
      </div>
    );
  }

  if (isError || !coach) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Coach not found</h3>
          <p>This spotlight may be unpublished or no longer exists.</p>
          <button className="btn-secondary" onClick={() => router.navigate({ to: "/coaches" })}>
            Back to coaches
          </button>
        </div>
      </div>
    );
  }

  const accent = coach.accentColor || "var(--accent)";
  const instagram = coach.socials.instagram?.replace(/^@/, "");
  const youtube = coach.socials.youtube?.replace(/^@/, "");

  return (
    <div className="page coach-detail" style={{ ["--coach-accent" as string]: accent }}>
      <button className="coach-back" onClick={() => router.navigate({ to: "/coaches" })}>
        ← All coaches
      </button>

      <div className="coach-hero">
        <div className="coach-hero-cover">
          {coach.coverPhoto
            ? <img src={coach.coverPhoto} alt="" />
            : <div className="coach-hero-cover-fallback" />}
          <div className="coach-hero-scrim" />
        </div>
        <div className="coach-hero-content">
          <div className="coach-hero-avatar">
            {coach.photoUrl
              ? <img src={coach.photoUrl} alt={coach.fullName} />
              : <span>{initials(coach.fullName)}</span>}
          </div>
          <div className="coach-hero-text">
            <h1>{coach.fullName || coach.email}</h1>
            <p className="coach-hero-tagline">{coach.tagline}</p>
            {coach.yearsExperience > 0 && (
              <span className="coach-hero-badge">{coach.yearsExperience} years coaching</span>
            )}
          </div>
        </div>
      </div>

      {coach.specialties.length > 0 && (
        <div className="coach-chips coach-chips-lg">
          {coach.specialties.map((s) => <span key={s} className="coach-chip">{s}</span>)}
        </div>
      )}

      {coach.bio && (
        <div className="card coach-bio">
          <h2 className="coach-section-title">About</h2>
          <p>{coach.bio}</p>
        </div>
      )}

      {coach.certifications.length > 0 && (
        <div className="card">
          <h2 className="coach-section-title">Certifications</h2>
          <ul className="coach-cert-list">
            {coach.certifications.map((c) => (
              <li key={c}><span className="coach-cert-tick" aria-hidden>✓</span>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {(instagram || coach.socials.website || youtube) && (
        <div className="card">
          <h2 className="coach-section-title">Find me</h2>
          <div className="coach-socials">
            {instagram && <SocialLink label={`@${instagram}`} icon="◎" href={`https://instagram.com/${instagram}`} />}
            {coach.socials.website && <SocialLink label="Website" icon="◈" href={coach.socials.website} />}
            {youtube && <SocialLink label={`@${youtube}`} icon="▷" href={`https://youtube.com/@${youtube}`} />}
          </div>
        </div>
      )}
    </div>
  );
}
