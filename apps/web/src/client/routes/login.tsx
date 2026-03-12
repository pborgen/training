import { useState, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "../auth";

declare global {
  interface Window { google?: { accounts: { id: { initialize: (cfg: any) => void; prompt: () => void } } } }
}

export function LoginPage() {
  const { signIn, isAuthenticated, getGoogleClientId, setGoogleClientId } = useAuth();
  const router = useRouter();
  const [clientId, setClientId] = useState(getGoogleClientId);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (isAuthenticated) router.navigate({ to: "/dashboard" });
  }, [isAuthenticated, router]);

  function handleGoogleSignIn() {
    if (!clientId.trim()) return setStatus("Enter Google Client ID first");
    setGoogleClientId(clientId.trim());

    if (!window.google) return setStatus("Google Identity Services not loaded. Check your connection.");

    window.google.accounts.id.initialize({
      client_id: clientId.trim(),
      callback: (resp: { credential: string }) => {
        try {
          const payload = JSON.parse(atob(resp.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
          signIn(resp.credential, payload.email || "unknown");
        } catch {
          setStatus("Sign-in failed: could not decode token");
        }
      },
    });
    window.google.accounts.id.prompt();
  }

  return (
    <div className="login-container">
      <h1>Training</h1>
      <p className="hint">Sign in to sync your workouts</p>

      <div className="form-stack">
        <input
          type="text"
          placeholder="Google Client ID"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        />
        <button className="btn-primary" onClick={handleGoogleSignIn}>
          Sign in with Google
        </button>
      </div>

      {status && <p className="hint" style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}
