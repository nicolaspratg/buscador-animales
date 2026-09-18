import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { verifyToken } from "../utils/token.js";

// Every failure is a 401 with the same code, so clients handle one case;
// the message says which one it was.
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.get("authorization");
  const match = header === undefined ? null : /^Bearer (\S+)$/.exec(header);
  const token = match?.[1];

  if (token === undefined) {
    throw new AppError(401, "UNAUTHORIZED", "Falta el token de autenticación");
  }

  const result = verifyToken(token);
  if (!result.ok) {
    const message = result.reason === "expired" ? "La sesión expiró" : "Token inválido";
    throw new AppError(401, "UNAUTHORIZED", message);
  }

  req.user = result.user;
  next();
};
