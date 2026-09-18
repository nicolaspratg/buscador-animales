import path from "node:path";
import { z } from "zod";

try {
  process.loadEnvFile();
} catch (error) {
  // .env is optional; anything else (e.g. a permissions error) should surface.
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
}

const DEV_JWT_SECRET = "dev-only-insecure-secret";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  JWT_SECRET: z.string().min(1).optional(),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(3600),
  DATA_DIR: z.string().default("database"),
});

const parsed = envSchema.parse(process.env);

if (parsed.JWT_SECRET === undefined && parsed.NODE_ENV !== "test") {
  console.warn("[env] JWT_SECRET not set, using an insecure dev default. Never deploy like this.");
}

const isProduction = parsed.NODE_ENV === "production";

// Relative paths resolve from the server workspace, which is the cwd for every npm script.
export const env = {
  port: parsed.PORT,
  jwtSecret: parsed.JWT_SECRET ?? DEV_JWT_SECRET,
  jwtExpiresInSeconds: parsed.JWT_EXPIRES_IN_SECONDS,
  dataDir: path.resolve(parsed.DATA_DIR),
  clientDir: isProduction ? path.resolve("../client/dist") : undefined,
};
