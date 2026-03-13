import { useState, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "../auth";
import { fetchDevAccounts, loginWithCredentials, type DevAccount } from "../api";

declare global {
  interface Window { google?: { accounts: { id: { initialize: (cfg: any) => void; renderButton: (el: HTMLElement, cfg: any) => void } } } }
}

const ROLE_ICONS: Record<string, string> = { admin: "\u2699\ufe0f", client: "\ud83c\udfcb\ufe0f" };

export function LoginPage() {
  const { signIn, isAuthenticated } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [devAccounts, setDevAccounts] = useState<DevAccount[] | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.navigate({ to: "/dashboard" });
  }, [isAuthenticated, router]);

  useEffect(() => {
    fetchDevAccounts().then(setDevAccounts);
  }, []);

  function handleDevSignIn(account: DevAccount) {
    signIn("dev", account.email, true);
  }

  async function handleCredentialLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    if (!username.trim() || !password.trim()) return setStatus("Enter username and password");
    setLoading(true);
    try {
      const result = await loginWithCredentials(username.trim(), password.trim());
      signIn("credentials", result.email, true);
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">T</div>
          <h1>Training</h1>
          <p>Track your workouts. Crush your goals.</p>
        </div>

        <form className="login-form" onSubmit={handleCredentialLogin}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button className="btn-primary login-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {status && <div className="login-error">{status}</div>}

        {devAccounts && (
          <>
            <div className="login-divider"><span>or quick login</span></div>
            <div className="dev-account-grid">
              {devAccounts.map((a) => (
                <button key={a.email} className="dev-account-btn" onClick={() => handleDevSignIn(a)}>
                  <span className="dev-account-icon">{ROLE_ICONS[a.role] || "\ud83d\udc64"}</span>
                  <span className="dev-account-name">{a.name}</span>
                  <span className="dev-account-role">{a.role}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
