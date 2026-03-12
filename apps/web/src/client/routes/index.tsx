import { useRouter } from "@tanstack/react-router";

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="landing">
      <section className="hero">
        <h1>Training</h1>
        <p className="hero-sub">Track workouts, build routines, crush goals.</p>
        <div className="hero-actions">
          <button className="btn-primary btn-lg" onClick={() => router.navigate({ to: "/login" })}>
            Get Started
          </button>
          <button className="btn-secondary btn-lg" onClick={() => router.navigate({ to: "/login" })}>
            Sign In
          </button>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>Build Routines</h3>
          <p>Create custom workout routines from a catalog of exercises or your own.</p>
        </div>
        <div className="feature-card">
          <h3>Track Sets</h3>
          <p>Log every set, rep, and weight during your workout in real time.</p>
        </div>
        <div className="feature-card">
          <h3>See Progress</h3>
          <p>Review workout history and volume trends over time.</p>
        </div>
        <div className="feature-card">
          <h3>Cross-Platform</h3>
          <p>Works on any device — phone, tablet, or desktop.</p>
        </div>
      </section>
    </div>
  );
}
