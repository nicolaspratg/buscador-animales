import { z } from "zod";

try {
  process.loadEnvFile();
} catch (error) {
  // .env is optional; anything else (e.g. a permissions error) should surface.
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
}

const DEV_JWT_SECRET = "dev-only-insecure-secret";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  JWT_SECRET: z.string().min(1).optional(),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(3600),
});

const parsed = envSchema.parse(process.env);

if (parsed.JWT_SECRET === undefined) {
  console.warn(`[env] JWT_SECRET not set, using an insecure dev default. Never deploy like this.`);
}

export const env = {
  port: parsed.PORT,
  jwtSecret: parsed.JWT_SECRET ?? DEV_JWT_SECRET,
  jwtExpiresInSeconds: parsed.JWT_EXPIRES_IN_SECONDS,
};
