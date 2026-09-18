import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import type { PublicUser } from "../repositories/users.repository.js";

const payloadSchema = z.object({
  sub: z.string().regex(/^\d+$/).transform(Number),
  email: z.string(),
});

export type TokenResult =
  | { ok: true; user: PublicUser }
  | { ok: false; reason: "expired" | "invalid" };

export function signToken(user: PublicUser): string {
  return jwt.sign({ email: user.email }, env.jwtSecret, {
    subject: String(user.id),
    expiresIn: env.jwtExpiresInSeconds,
    algorithm: "HS256",
  });
}

export function verifyToken(token: string): TokenResult {
  try {
    // Pinning the algorithm rejects tokens that try to downgrade to "none".
    const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    const payload = payloadSchema.safeParse(decoded);
    if (!payload.success) return { ok: false, reason: "invalid" };
    return { ok: true, user: { id: payload.data.sub, email: payload.data.email } };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) return { ok: false, reason: "expired" };
    return { ok: false, reason: "invalid" };
  }
}
