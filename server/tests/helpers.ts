import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { createApp } from "../src/app.js";

const REAL_DATA_DIR = path.resolve(import.meta.dirname, "../database");

/** An app backed by a throwaway copy of the data, so tests never touch database/. */
export async function createTestApp() {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "buscador-test-"));
  await copyFile(path.join(REAL_DATA_DIR, "animals.json"), path.join(dataDir, "animals.json"));

  return {
    app: createApp({ dataDir }),
    readUsersFile: async (): Promise<unknown> =>
      JSON.parse(await readFile(path.join(dataDir, "users.json"), "utf8")),
    cleanup: () => rm(dataDir, { recursive: true, force: true }),
  };
}

export async function signupAndGetToken(app: ReturnType<typeof createApp>, email = "test@example.com") {
  const res = await request(app).post("/api/auth/signup").send({ email, password: "secret123" });
  const token: unknown = res.body.token;
  if (typeof token !== "string") throw new Error(`signup failed: ${res.status}`);
  return token;
}
