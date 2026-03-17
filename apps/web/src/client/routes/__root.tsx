import { Outlet, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../auth";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard", bottomNav: true },
  { to: "/schedule", label: "Schedule", icon: "calendar", clientOnly: true, bottomNav: true },
  { to: "/workout", label: "Workout", icon: "workout", bottomNav: true },
  { to: "/readiness", label: "Readiness", icon: "readiness", bottomNav: true },
  { to: "/exercises", label: "Exercises", icon: "exercises" },
  { to: "/coach", label: "Coach", icon: "coach", bottomNav: true },
  { to: "/calendar", label: "Calendar", icon: "calendar", adminOnly: true, bottomNav: true },
  { to: "/users", label: "Users", icon: "users", adminOnly: true, bottomNav: true },
  { to: "/knowledge", label: "Knowledge", icon: "knowledge", adminOnly: true },
  { to: "/labels", label: "Labels", icon: "label", adminOnly: true },
  { to: "/profile", label: "Profile", icon: "profile" },
] as const;

function NavIcon({ name, size = 22 }: { name: string; size?: number }) {
  const s = { width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "dashboard":
      return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="4" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>;
    case "workout":
      return <svg viewBox="0 0 24 24" {...s}><path d="M6.5 6.5v11M17.5 6.5v11M6.5 12h11M2 8.5v7M22 8.5v7M4.25 7v10M19.75 7v10"/></svg>;
    case "readiness":
      return <svg viewBox="0 0 24 24" {...s}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>;
    case "exercises":
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="20" cy="18" r="2" fill="currentColor" stroke="none"/></svg>;
    case "profile":
      return <svg viewBox="0 0 24 24" {...s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case "knowledge":
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8M8 11h6"/></svg>;
    case "label":
      return <svg viewBox="0 0 24 24" {...s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
    case "users":
      return <svg viewBox="0 0 24 24" {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "coach":
      return <svg viewBox="0 0 24 24" {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "calendar":
      return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case "menu":
      return <svg viewBox="0 0 24 24" {...s}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
    case "close":
      return <svg viewBox="0 0 24 24" {...s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "logout":
      return <svg viewBox="0 0 24 24" {...s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    default:
      return null;
  }
}

export function RootLayout() {
  const { isAuthenticated, user, signOut } = useAuth();
  const router = useRouter();
  const [path, setPath] = useState(router.state.location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Subscribe to route changes so path is always current after navigation completes
  useEffect(() => {
    setPath(router.state.location.pathname);
    return router.subscribe("onResolved", (state) => {
      setPath(state.toLocation.pathname);
    });
  }, [router]);

  const isPublic = path === "/" || path === "/login";
  const isAdmin = user?.role === "admin";
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if ("adminOnly" in item && item.adminOnly) return isAdmin;
    if ("clientOnly" in item && item.clientOnly) return !isAdmin;
    return true;
  });

  function navigate(to: string) {
    router.navigate({ to });
    setSidebarOpen(false);
  }

  return (
    <>
      {isAuthenticated && !isPublic && (
        <>
          {/* Header */}
          <header className="app-header">
            <button className="header-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Menu">
              <NavIcon name={sidebarOpen ? "close" : "menu"} size={20} />
            </button>
            <span className="app-title">PFA Training</span>
            <span className="header-right">
              <span className="user-email">{user?.email}</span>
              <button className="btn-link" onClick={() => { signOut(); router.navigate({ to: "/login" }); }}>
                <NavIcon name="logout" size={16} />
              </button>
            </span>
          </header>

          {/* Sidebar overlay (mobile) */}
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

          {/* Sidebar */}
          <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="sidebar-brand">
              <div className="sidebar-logo">P</div>
              <span className="sidebar-title">PFA Training</span>
            </div>
            <nav className="sidebar-nav">
              {visibleNavItems.map((item) => (
                <button
                  key={item.to}
                  className={`sidebar-item ${path === item.to || (item.to === "/dashboard" && path.startsWith("/routines")) ? "active" : ""}`}
                  onClick={() => navigate(item.to)}
                >
                  <NavIcon name={item.icon} size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="sidebar-footer">
              <div className="sidebar-user">
                <NavIcon name="profile" size={18} />
                <span className="sidebar-user-email">{user?.email}</span>
              </div>
              <button className="sidebar-item" onClick={() => { signOut(); router.navigate({ to: "/login" }); }}>
                <NavIcon name="logout" size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Bottom nav (mobile) — limited to core items */}
          <nav className="bottom-nav">
            {visibleNavItems.filter(item => "bottomNav" in item && item.bottomNav).map((item) => (
              <button
                key={item.to}
                className={`nav-item ${path === item.to ? "active" : ""}`}
                onClick={() => router.navigate({ to: item.to })}
              >
                <span className="nav-icon"><NavIcon name={item.icon} size={20} /></span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </>
      )}
      {isPublic ? (
        <Outlet />
      ) : (
        <main className={isAuthenticated ? "with-nav" : ""}>
          <Outlet />
        </main>
      )}
    </>
  );
}
