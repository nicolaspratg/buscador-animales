import type { AuthResponse } from "@shared/types";
import { apiRequest } from "./client";

export interface Credentials {
  email: string;
  password: string;
}

export function login(credentials: Credentials): Promise<AuthResponse> {
  return apiRequest("/api/auth/login", { method: "POST", body: credentials });
}

export function signup(credentials: Credentials): Promise<AuthResponse> {
  return apiRequest("/api/auth/signup", { method: "POST", body: credentials });
}
