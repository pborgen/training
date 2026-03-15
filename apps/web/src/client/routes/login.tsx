import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "../auth";
import { fetchDevAccounts, fetchAuthConfig, loginWithCredentials, loginWithGoogle, type DevAccount } from "../api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, config: { theme: string; size: string; width: number; text: string }) => void;
        };
      };
    };
  }
}

const ROLE_ICONS: Record<string, string> = { admin: "\u2699\ufe0f", client: "\ud83c\udfcb\ufe0f" };
const PFA_LOGO = "https://images.squarespace-cdn.com/content/v1/57fef5f4e6f2e1a3ef7c6696/1485724156548-OZA8P2UZELE7H1MPGE2K/PFA_Wormdark_White.png";

export function LoginPage() {
  const { signIn, isAuthenticated } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [devAccounts, setDevAccounts] = useState<DevAccount[] | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.invalidate().then(() => router.navigate({ to: "/dashboard" }));
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    fetchDevAccounts().then(setDevAccounts);
    fetchAuthConfig().then(c => setGoogleClientId(c.googleClientId));
  }, []);

  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    setStatus("");
    setLoading(true);
    try {
      const result = await loginWithGoogle(response.credential);
      signIn(response.credential, result.email, false, result.role);
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [signIn]);

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) return;

    function tryRender() {
      if (!window.google || !googleBtnRef.current) return false;
      window.google.accounts.id.initialize({
        client_id: googleClientId!,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "filled_black",
        size: "large",
        width: 300,
        text: "signin_with",
      });
      return true;
    }

    if (tryRender()) return;

    // GIS script may not have loaded yet — poll briefly
    const interval = setInterval(() => {
      if (tryRender()) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [googleClientId, handleGoogleCredential]);

  function handleDevSignIn(account: DevAccount) {
    signIn("dev", account.email, true, account.role);
  }

  async function handleCredentialLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    if (!username.trim() || !password.trim()) return setStatus("Enter username and password");
    setLoading(true);
    try {
      const result = await loginWithCredentials(username.trim(), password.trim());
      signIn("credentials", result.email, true, result.role);
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
          <img src={PFA_LOGO} alt="PFA" className="login-pfa-logo" />
          <h1>Premier Fitness Alliance</h1>
          <p>Precision Training. Real Results.</p>
        </div>

        {googleClientId && (
          <>
            <div className="google-signin-wrapper">
              <div ref={googleBtnRef} />
            </div>
            <div className="login-divider"><span>or sign in with credentials</span></div>
          </>
        )}

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
