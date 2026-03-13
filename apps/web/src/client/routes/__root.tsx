import { Outlet, useRouter } from "@tanstack/react-router";
import { useAuth } from "../auth";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "home" },
  { to: "/workout", label: "Workout", icon: "play" },
  { to: "/readiness", label: "Readiness", icon: "readiness" },
  { to: "/exercises", label: "Exercises", icon: "exercise" },
  { to: "/profile", label: "Profile", icon: "person" },
] as const;

const ICONS: Record<string, string> = {
  home: "\u2302",
  play: "\u25B6",
  readiness: "\u2665",
  exercise: "\u2660",
  person: "\u263A",
};

export function RootLayout() {
  const { isAuthenticated, user, signOut } = useAuth();
  const router = useRouter();
  const path = router.state.location.pathname;
  const isPublic = path === "/" || path === "/login";

  return (
    <>
      {isAuthenticated && !isPublic && (
        <header className="app-header">
          <span className="app-title">Training</span>
          <span className="header-right">
            <span className="user-email">{user?.email}</span>
            <button className="btn-link" onClick={() => { signOut(); router.navigate({ to: "/login" }); }}>Sign Out</button>
          </span>
        </header>
      )}
      <main className={isAuthenticated && !isPublic ? "with-nav" : ""}>
        <Outlet />
      </main>
      {isAuthenticated && !isPublic && (
        <nav className="bottom-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.to}
              className={`nav-item ${path === item.to ? "active" : ""}`}
              onClick={() => router.navigate({ to: item.to })}
            >
              <span className="nav-icon">{ICONS[item.icon]}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
