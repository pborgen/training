/* Shared API client — attaches to window.TrainingAPI */

const TrainingAPI = (() => {
  function authHeaders(): Record<string, string> {
    const auth = (window as any).TrainingAuth?.getAuth();
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (auth?.idToken) h["Authorization"] = `Bearer ${auth.idToken}`;
    return h;
  }

  async function request(method: string, path: string, body?: unknown) {
    const res = await fetch(path, {
      method,
      headers: authHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      (window as any).TrainingAuth?.clearAuth();
      window.location.href = "/login.html";
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }

  return {
    get: (path: string) => request("GET", path),
    post: (path: string, body: unknown) => request("POST", path, body),
    put: (path: string, body: unknown) => request("PUT", path, body),
    del: (path: string) => request("DELETE", path),
  };
})();

(window as any).TrainingAPI = TrainingAPI;
