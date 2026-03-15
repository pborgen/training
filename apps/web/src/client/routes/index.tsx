import { useRouter } from "@tanstack/react-router";

const HERO_IMG = "https://images.squarespace-cdn.com/content/v1/57fef5f4e6f2e1a3ef7c6696/1671482300208-OQPOS36O99J3WIPYVRQF/Tolland%2Bsprint.jpg";
const GALLERY = [
  { src: "https://images.squarespace-cdn.com/content/v1/57fef5f4e6f2e1a3ef7c6696/1671482872613-33SY6A1JQFJ0GN1QP29I/SoFire%2Bjump.jpg", alt: "Athlete training" },
  { src: "https://images.squarespace-cdn.com/content/v1/57fef5f4e6f2e1a3ef7c6696/1671482913164-AG90ZNMD300WN2T9SR3Q/D%2Band%2BTiks.jpg", alt: "Coaching session" },
  { src: "https://images.squarespace-cdn.com/content/v1/57fef5f4e6f2e1a3ef7c6696/1671483046680-EREN13NPT8BSGTBHIV2P/Emms%2Band%2BD.jpg", alt: "One on one training" },
];

const PFA_LOGO = "https://images.squarespace-cdn.com/content/v1/57fef5f4e6f2e1a3ef7c6696/1485724156548-OZA8P2UZELE7H1MPGE2K/PFA_Wormdark_White.png";

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero" style={{ backgroundImage: `linear-gradient(to bottom, rgba(10,10,10,0.45) 0%, rgba(10,10,10,0.85) 100%), url(${HERO_IMG})` }}>
        <img src={PFA_LOGO} alt="Premier Fitness Alliance" className="hero-logo" />
        <h1>PREMIER FITNESS ALLIANCE</h1>
        <p className="hero-tagline">Unapologetic Authenticity. Precision Training.</p>
        <p className="hero-sub">Track workouts, build routines, and crush your goals with the tools that match your intensity.</p>
        <div className="hero-actions">
          <button className="btn-primary btn-lg" onClick={() => router.navigate({ to: "/login" })}>
            GET STARTED
          </button>
          <button className="btn-outline btn-lg" onClick={() => router.navigate({ to: "/login" })}>
            SIGN IN
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2 className="section-title">BUILT FOR ATHLETES</h2>
        <div className="features">
          <div className="feature-card">
            <div className="feature-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><path d="M6.5 6.5v11M17.5 6.5v11M6.5 12h11M2 8.5v7M22 8.5v7M4.25 7v10M19.75 7v10"/></svg>
            </div>
            <h3>Build Routines</h3>
            <p>Create custom workout routines from a catalog of exercises or design your own.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="4" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
            </div>
            <h3>Track Every Set</h3>
            <p>Log every set, rep, and weight during your workout in real time.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <h3>Readiness Check-ins</h3>
            <p>Monitor sleep, energy, stress, and soreness to train smarter every day.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <h3>See Progress</h3>
            <p>Review workout history and volume trends to see how far you've come.</p>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="gallery-section">
        <h2 className="section-title">THE PFA WAY</h2>
        <div className="gallery-grid">
          {GALLERY.map((img, i) => (
            <div key={i} className="gallery-item">
              <img src={img.src} alt={img.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>READY TO TRAIN?</h2>
        <p>Join the alliance. Track your progress. Dominate your goals.</p>
        <button className="btn-primary btn-lg" onClick={() => router.navigate({ to: "/login" })}>
          CONNECT NOW
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <img src={PFA_LOGO} alt="PFA" className="footer-logo" />
        <p>Premier Fitness Alliance</p>
      </footer>
    </div>
  );
}
