import type { ErrorRequestHandler, RequestHandler } from "express";
import type { ApiErrorBody } from "@shared/types.js";
import { AppError } from "../errors/AppError.js";

export const notFound: RequestHandler = (req) => {
  throw new AppError(404, "NOT_FOUND", `Ruta no encontrada: ${req.method} ${req.path}`);
};

// Errors raised by Express itself (malformed JSON body, payload too large)
// carry a 4xx `status` and are safe to report as a bad request.
function clientErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  const { status } = error;
  return typeof status === "number" && status >= 400 && status < 500 ? status : undefined;
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  let status = 500;
  let body: ApiErrorBody = { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" } };

  if (error instanceof AppError) {
    status = error.status;
    body = { error: { code: error.code, message: error.message } };
    if (error.details !== undefined) body.error.details = error.details;
  } else {
    const clientStatus = clientErrorStatus(error);
    if (clientStatus !== undefined) {
      status = clientStatus;
      body = { error: { code: "BAD_REQUEST", message: "Solicitud inválida" } };
    }
  }

  // Stack traces go to the log, never to the client.
  if (status >= 500) console.error(error);
  res.status(status).json(body);
};
