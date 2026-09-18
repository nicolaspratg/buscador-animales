import type { ApiErrorBody } from "@shared/types.js";

type ErrorDetails = NonNullable<ApiErrorBody["error"]["details"]>;

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ErrorDetails | undefined;

  constructor(status: number, code: string, message: string, details?: ErrorDetails) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
