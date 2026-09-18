import type { AuthResponse } from "@shared/types";

export type Session = AuthResponse;

const STORAGE_KEY = "buscador-animales.session";

function isSession(value: unknown): value is Session {
  if (typeof value !== "object" || value === null) return false;
  if (!("token" in value) || typeof value.token !== "string") return false;
  if (!("user" in value) || typeof value.user !== "object" || value.user === null) return false;
  const { user } = value;
  return "id" in user && typeof user.id === "number" && "email" in user && typeof user.email === "string";
}

// Reads `exp` without verifying the signature; the server still verifies every
// request. This only avoids rendering a protected page for an already-dead token.
function isExpired(token: string): boolean {
  const payload = token.split(".")[1];
  if (payload === undefined) return true;
  try {
    const decoded: unknown = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof decoded !== "object" || decoded === null || !("exp" in decoded)) return true;
    return typeof decoded.exp !== "number" || decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isSession(parsed) && !isExpired(parsed.token)) return parsed;
    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable (private mode, quota); the session still lives in memory.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
