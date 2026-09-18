import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthResponse } from "@shared/types";
import * as authApi from "../api/auth";
import { configureApiClient } from "../api/client";
import { clearSession, loadSession, saveSession, type Session } from "./session";

interface AuthContextValue {
  user: AuthResponse["user"] | null;
  login(credentials: authApi.Credentials): Promise<void>;
  signup(credentials: authApi.Credentials): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // localStorage is read synchronously during the first render, so an authenticated
  // user never sees a flash of the login page on refresh. No loading state needed.
  const [session, setSession] = useState<Session | null>(loadSession);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  // Layout effect: the client must know the token before any child effect fetches.
  useLayoutEffect(() => {
    configureApiClient({ getToken: () => session?.token ?? null, onUnauthorized: logout });
  }, [session, logout]);

  const value = useMemo<AuthContextValue>(() => {
    const start = (next: Session) => {
      saveSession(next);
      setSession(next);
    };
    return {
      user: session?.user ?? null,
      login: async (credentials) => start(await authApi.login(credentials)),
      signup: async (credentials) => start(await authApi.signup(credentials)),
      logout,
    };
  }, [session, logout]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
