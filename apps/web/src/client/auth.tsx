import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AuthState } from "./types";

const AUTH_KEY = "training_app_auth_v1";
const PREFS_KEY = "training_app_prefs_v1";

interface AuthContextValue {
  user: AuthState | null;
  isAuthenticated: boolean;
  signIn: (idToken: string, email: string) => void;
  signOut: () => void;
  getGoogleClientId: () => string;
  setGoogleClientId: (id: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

function loadPrefs(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState | null>(loadAuth);

  const signIn = useCallback((idToken: string, email: string) => {
    const state: AuthState = { idToken, email, authenticatedAt: new Date().toISOString() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
    setUser(state);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  const getGoogleClientId = useCallback(() => {
    return loadPrefs().googleClientId || "";
  }, []);

  const setGoogleClientId = useCallback((id: string) => {
    const prefs = loadPrefs();
    prefs.googleClientId = id;
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signOut, getGoogleClientId, setGoogleClientId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
