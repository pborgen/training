/* Shared auth utilities — attaches to window.TrainingAuth */

interface AuthState {
  idToken: string;
  email: string;
  authenticatedAt: string;
}

const TrainingAuth = (() => {
  const AUTH_KEY = "training_app_auth_v1";
  const PREFS_KEY = "training_app_prefs_v1";

  function getAuth(): AuthState | null {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthState;
    } catch {
      return null;
    }
  }

  function setAuth(idToken: string, email: string): void {
    const state: AuthState = { idToken, email, authenticatedAt: new Date().toISOString() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  }

  function clearAuth(): void {
    localStorage.removeItem(AUTH_KEY);
  }

  function getSyncEndpoint(): string {
    try {
      const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      return prefs.syncEndpoint || `${location.origin}/api/sync`;
    } catch {
      return `${location.origin}/api/sync`;
    }
  }

  function getBaseUrl(): string {
    return getSyncEndpoint().replace(/\/api\/sync$/, "");
  }

  function authHeaders(idToken: string): Record<string, string> {
    const h: Record<string, string> = {};
    if (idToken) h["Authorization"] = `Bearer ${idToken}`;
    return h;
  }

  async function validateSession(idToken: string): Promise<{ valid: boolean; email: string }> {
    try {
      const res = await fetch(`${getBaseUrl()}/api/session`, { headers: authHeaders(idToken) });
      if (!res.ok) return { valid: false, email: "" };
      const data = await res.json() as { authenticated?: boolean; email?: string };
      return { valid: Boolean(data.authenticated), email: data.email || "" };
    } catch {
      return { valid: false, email: "" };
    }
  }

  function requireAuth(): AuthState {
    const auth = getAuth();
    if (!auth) {
      window.location.href = "/login.html";
      throw new Error("Not authenticated");
    }
    return auth;
  }

  return { getAuth, setAuth, clearAuth, getSyncEndpoint, getBaseUrl, authHeaders, validateSession, requireAuth };
})();

(window as any).TrainingAuth = TrainingAuth;
