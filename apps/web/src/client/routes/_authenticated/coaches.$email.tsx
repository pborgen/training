import { useState } from "react";
import { useRouter, useParams } from "@tanstack/react-router";
import { useCoach, useMyRequests, useRequestCoach } from "../../hooks/useCoaches";
import { useAuth } from "../../auth";
import type { CoachMedia, CoachPlan, CoachSpotlight } from "../../types";

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

/** Turn a YouTube/Vimeo/direct URL into something embeddable. */
function videoEmbed(url: string): { kind: "iframe" | "video"; src: string } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url) || url.startsWith("data:video")) return { kind: "video", src: url };
  return { kind: "iframe", src: url };
}

function GalleryItem({ media }: { media: CoachMedia }) {
  if (media.type === "photo") {
    return (
      <figure className="coach-gallery-item">
        <img src={media.url} alt={media.caption || ""} loading="lazy" />
        {media.caption && <figcaption>{media.caption}</figcaption>}
      </figure>
    );
  }
  const embed = videoEmbed(media.url);
  return (
    <figure className="coach-gallery-item coach-gallery-video">
      <div className="coach-video-frame">
        {embed?.kind === "video"
          ? <video src={embed.src} controls preload="metadata" />
          : embed
            ? <iframe src={embed.src} title={media.caption || "Video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            : null}
      </div>
      {media.caption && <figcaption>{media.caption}</figcaption>}
    </figure>
  );
}

function PlanCard({ plan, onApply, applied }: { plan: CoachPlan; onApply: () => void; applied: boolean }) {
  return (
    <div className={`plan-card ${plan.popular ? "plan-popular" : ""}`}>
      {plan.popular && <span className="plan-badge">Most popular</span>}
      <h3 className="plan-name">{plan.name}</h3>
      <div className="plan-price">
        {plan.price > 0 ? <><span className="plan-amount">${plan.price}</span><span className="plan-cadence">/{plan.cadence || "month"}</span></> : <span className="plan-amount">Custom</span>}
      </div>
      {plan.description && <p className="plan-desc">{plan.description}</p>}
      {plan.features.length > 0 && (
        <ul className="plan-features">
          {plan.features.map((f, i) => <li key={i}><span className="plan-tick" aria-hidden>✓</span>{f}</li>)}
        </ul>
      )}
      <button className={applied ? "btn-secondary" : "btn-primary"} onClick={onApply} disabled={applied}>
        {applied ? "Request sent" : "Choose plan"}
      </button>
    </div>
  );
}

function ApplyModal({ coach, plan, onClose }: { coach: CoachSpotlight; plan: CoachPlan | null; onClose: () => void }) {
  const request = useRequestCoach();
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  function submit() {
    request.mutate(
      { email: coach.email, planId: plan?.id, planName: plan?.name, message },
      { onSuccess: () => setDone(true) },
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <h2 className="coach-section-title">Request sent! 🎉</h2>
            <p>
              {coach.fullName || coach.email} will see your request{plan ? <> for the <strong>{plan.name}</strong> plan</> : null} and reach out. You can track it under <strong>My Requests</strong>.
            </p>
            <div className="modal-actions">
              <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="coach-section-title">Train with {coach.fullName || "this coach"}</h2>
            {plan && (
              <p className="apply-plan-line">
                Plan: <strong>{plan.name}</strong>
                {plan.price > 0 && <> — ${plan.price}/{plan.cadence || "month"}</>}
              </p>
            )}
            <label className="form-label">
              Add a note (optional)
              <textarea
                rows={4}
                value={message}
                placeholder="Your goals, schedule, or anything the coach should know…"
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            {request.isError && <p className="form-error">Couldn't send request. Please try again.</p>}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose} disabled={request.isPending}>Cancel</button>
              <button className="btn-primary" onClick={submit} disabled={request.isPending}>
                {request.isPending ? "Sending…" : "Send request"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CoachDetailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { email } = useParams({ strict: false }) as { email: string };
  const { data: coach, isLoading, isError } = useCoach(email);
  const { data: myRequests } = useMyRequests();
  const [applyPlan, setApplyPlan] = useState<CoachPlan | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);

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
  const isOwnSpotlight = user?.email === coach.email;
  const hasPending = (myRequests || []).some((r) => r.coachEmail === coach.email && r.status !== "declined");

  function openApply(plan: CoachPlan | null) {
    setApplyPlan(plan);
    setApplyOpen(true);
  }

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
          {!isOwnSpotlight && (
            <button className="btn-primary coach-hero-cta" onClick={() => openApply(null)} disabled={hasPending}>
              {hasPending ? "Request sent" : "Work with me"}
            </button>
          )}
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

      {coach.gallery.length > 0 && (
        <div className="coach-section">
          <h2 className="coach-section-title">Gallery</h2>
          <div className="coach-gallery">
            {coach.gallery.map((m, i) => <GalleryItem key={i} media={m} />)}
          </div>
        </div>
      )}

      {coach.plans.length > 0 && (
        <div className="coach-section">
          <h2 className="coach-section-title">Plans &amp; Pricing</h2>
          <div className="plans-grid">
            {coach.plans.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                applied={hasPending}
                onApply={() => (isOwnSpotlight ? undefined : openApply(p))}
              />
            ))}
          </div>
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

      {applyOpen && <ApplyModal coach={coach} plan={applyPlan} onClose={() => setApplyOpen(false)} />}
    </div>
  );
}
