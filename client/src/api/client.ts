import type { ApiErrorBody } from "@shared/types";

type ErrorPayload = ApiErrorBody["error"];

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: NonNullable<ErrorPayload["details"]>;

  constructor(status: number, { code, message, details = [] }: ErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Validation details keyed by field, ready to render under each input. */
  fieldErrors(): Partial<Record<string, string>> {
    return Object.fromEntries(this.details.map((detail) => [detail.field, detail.message]));
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(0, { code: "UNKNOWN", message: "Ocurrió un error inesperado" });
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const { error } = value;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    "message" in error &&
    typeof error.message === "string"
  );
}

let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => undefined;

/** Wired once by AuthProvider, so no component ever handles token expiry itself. */
export function configureApiClient(config: { getToken: () => string | null; onUnauthorized: () => void }) {
  getToken = config.getToken;
  onUnauthorized = config.onUnauthorized;
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, { method = "GET", body, signal }: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token !== null) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(new URL(path, window.location.origin), {
      method,
      headers,
      body: body === undefined ? null : JSON.stringify(body),
      signal: signal ?? null,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, { code: "NETWORK_ERROR", message: "No se pudo conectar con el servidor" });
  }

  // Trusted to match T: both sides compile against shared/types.ts, and every
  // server handler declares its response body with that same type.
  if (response.ok) return response.json();

  const payload: unknown = await response.json().catch(() => undefined);
  const error = isApiErrorBody(payload)
    ? payload.error
    : { code: "HTTP_ERROR", message: `Error inesperado del servidor (${response.status})` };

  // A 401 on an authenticated request means the session is gone. A 401 from
  // login (no token sent) is just wrong credentials and must reach the form.
  if (response.status === 401 && token !== null) onUnauthorized();

  throw new ApiError(response.status, error);
}
