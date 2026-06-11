import { useRouter } from "@tanstack/react-router";
import { HelixMark } from "../components/brand";

function Icon({ name }: { name: string }) {
  const s = { width: 26, height: 26, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "routine":
      return <svg viewBox="0 0 24 24" {...s}><path d="M6.5 6.5v11M17.5 6.5v11M6.5 12h11M2 8.5v7M22 8.5v7M4.25 7v10M19.75 7v10" /></svg>;
    case "track":
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 17l5-5 4 4 8-8" /><path d="M16 8h5v5" /></svg>;
    case "readiness":
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 12h4l2 6 4-14 2 8h6" /></svg>;
    case "ai":
      return <svg viewBox="0 0 24 24" {...s}><rect x="4" y="5" width="16" height="13" rx="3" /><path d="M9 5V3M15 5V3" /><circle cx="9" cy="11.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="11.5" r="1.2" fill="currentColor" stroke="none" /><path d="M9.5 15h5" /></svg>;
    default:
      return null;
  }
}

const FEATURES = [
  { icon: "routine", title: "Protocol Builder", body: "Compose training and supplementation protocols from a structured exercise library — or design your own from scratch." },
  { icon: "track", title: "Track Every Set", body: "Log sets, reps, load, and RPE in real time. Volume and trend data is captured the moment you lift." },
  { icon: "readiness", title: "Readiness Signals", body: "Sleep, energy, stress, and soreness roll up into a daily readiness score that tunes how hard you push." },
  { icon: "ai", title: "AI Coaching Team", body: "A multi-agent coach reads your history and readiness to adjust loads, answer questions, and keep you on protocol." },
];

const METRICS = [
  { value: "87", unit: "readiness", note: "recovered" },
  { value: "18.4k", unit: "weekly volume", note: "+6% vs last" },
  { value: "RPE 8.1", unit: "avg intensity", note: "on target" },
];

export function LandingPage() {
  const router = useRouter();
  const go = () => router.navigate({ to: "/login" });

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-inner">
          <span className="hero-eyebrow">AI-guided training · peptide protocols</span>
          <div className="hero-helix"><HelixMark size={88} /></div>
          <h1>HELIX</h1>
          <p className="hero-tagline">Engineered Performance</p>
          <p className="hero-sub">
            A precision training system that fuses real-time logging, daily readiness, and an
            AI coaching team — so every session, recovery window, and protocol is dialed in.
          </p>
          <div className="hero-actions">
            <button className="btn-primary btn-lg" onClick={go}>Get started</button>
            <button className="btn-outline btn-lg" onClick={go}>Sign in</button>
          </div>

          <div className="metric-strip">
            {METRICS.map((m) => (
              <div className="metric" key={m.unit}>
                <span className="metric-value">{m.value}</span>
                <span className="metric-unit">{m.unit}</span>
                <span className="metric-note">{m.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <span className="section-eyebrow">The system</span>
        <h2 className="section-title">Built around your biology</h2>
        <div className="features">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon-wrap"><Icon name={f.icon} /></div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Coach preview — image-free product mock */}
      <section className="showcase-section">
        <div className="showcase-inner">
          <div className="showcase-copy">
            <span className="section-eyebrow">Coaching team</span>
            <h2 className="section-title">An AI coach that knows your protocol</h2>
            <p>
              HELIX reads your readiness, training history, and goals, then adapts in plain
              language. Ask about loads, deloads, or peptide timing — get answers grounded in
              your own data.
            </p>
            <button className="btn-primary" onClick={go}>Meet your coach</button>
          </div>
          <div className="coach-preview" aria-hidden="true">
            <div className="coach-preview-head">
              <HelixMark size={20} />
              <span>HELIX Coach</span>
              <span className="coach-status">online</span>
            </div>
            <div className="chat-row chat-user"><span>Readiness is at 64 today. Still hit legs?</span></div>
            <div className="chat-row chat-ai">
              <span>Recovery's a touch low — let's keep the session but drop top sets to RPE 7
              and trim volume 15%. I'll log it as an autoregulated day.</span>
            </div>
            <div className="chat-row chat-ai chat-meta"><span>Adjusted · Back Squat 4×5 → 4×4 @ RPE 7</span></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Train by the numbers</h2>
        <p>Join HELIX. Capture every signal. Let the system engineer your progress.</p>
        <button className="btn-primary btn-lg" onClick={go}>Create your account</button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span className="footer-logo"><HelixMark size={32} /></span>
        <p>HELIX — Engineered Performance</p>
      </footer>
    </div>
  );
}
