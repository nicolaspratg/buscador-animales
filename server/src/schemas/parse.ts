import type { z } from "zod";
import { AppError } from "../errors/AppError.js";

/**
 * Validates request input and returns the typed result, or throws a 400 whose
 * `details` map one-to-one onto form fields. Called from controllers rather than
 * as middleware: Express 5 makes req.query read-only, and returning the parsed
 * value keeps its inferred type without casting.
 */
export function parseInput<T>(schema: z.ZodType<T>, input: unknown, message: string): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const details = result.error.issues.map((issue) => ({
    field: issue.path.map(String).join("."),
    message: issue.message,
  }));
  throw new AppError(400, "VALIDATION_ERROR", message, details);
}
