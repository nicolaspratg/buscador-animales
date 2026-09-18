import type { RequestHandler } from "express";
import type { AuthResponse } from "@shared/types.js";
import { credentialsSchema } from "../schemas/auth.schemas.js";
import { parseInput } from "../schemas/parse.js";
import type { AuthService } from "../services/auth.service.js";

export function createAuthController(auth: AuthService) {
  const signup: RequestHandler<unknown, AuthResponse> = async (req, res) => {
    const credentials = parseInput(credentialsSchema, req.body, "Datos de registro inválidos");
    res.status(201).json(await auth.signup(credentials));
  };

  const login: RequestHandler<unknown, AuthResponse> = async (req, res) => {
    const credentials = parseInput(credentialsSchema, req.body, "Datos de inicio de sesión inválidos");
    res.json(await auth.login(credentials));
  };

  return { signup, login };
}
