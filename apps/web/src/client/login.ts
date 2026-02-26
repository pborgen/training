/* Login page logic */

declare global {
  interface Window { google: any; TrainingAuth: any; }
}

const PREFS_KEY = "training_app_prefs_v1";

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    if (p.googleClientId) el<HTMLInputElement>("googleClientId").value = p.googleClientId;
    el<HTMLInputElement>("syncEndpoint").value = p.syncEndpoint || `${location.origin}/api/sync`;
  } catch {
    el<HTMLInputElement>("syncEndpoint").value = `${location.origin}/api/sync`;
  }
}

function savePrefs() {
  const prefs = {
    googleClientId: el<HTMLInputElement>("googleClientId").value.trim(),
    syncEndpoint: el<HTMLInputElement>("syncEndpoint").value.trim()
  };
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function setStatus(text: string) {
  el<HTMLElement>("status").textContent = text;
}

/* On load: if already authenticated, skip to dashboard */
(async () => {
  loadPrefs();
  const auth = window.TrainingAuth.getAuth();
  if (auth) {
    setStatus("Checking session...");
    const session = await window.TrainingAuth.validateSession(auth.idToken);
    if (session.valid) {
      window.location.href = "/dashboard.html";
      return;
    }
    window.TrainingAuth.clearAuth();
    setStatus("Session expired. Please sign in again.");
  }
})();

el<HTMLButtonElement>("googleSignInBtn").addEventListener("click", () => {
  const clientId = el<HTMLInputElement>("googleClientId").value.trim();
  if (!clientId) return setStatus("Enter Google Client ID first");
  savePrefs();

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (resp: { credential: string }) => {
      const idToken = resp.credential;
      try {
        const payload = JSON.parse(atob(idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        const email = payload.email || "unknown";
        window.TrainingAuth.setAuth(idToken, email);
        setStatus(`Signed in as ${email}. Redirecting...`);
        window.location.href = "/dashboard.html";
      } catch {
        setStatus("Sign-in failed: could not decode token");
      }
    }
  });
  window.google.accounts.id.prompt();
});
