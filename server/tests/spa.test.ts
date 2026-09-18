import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

let clientDir: string;
beforeAll(async () => {
  clientDir = await mkdtemp(path.join(os.tmpdir(), "buscador-client-"));
  await writeFile(path.join(clientDir, "index.html"), "<!doctype html><title>spa</title>");
});
afterAll(() => rm(clientDir, { recursive: true, force: true }));

describe("production mode (serving the built client)", () => {
  it("serves the SPA shell for client-side routes", async () => {
    const res = await request(createApp({ dataDir: "unused", clientDir })).get("/login");

    expect(res.status).toBe(200);
    expect(res.text).toContain("<title>spa</title>");
  });

  it("still answers unknown API routes with a JSON 404, not the SPA shell", async () => {
    const res = await request(createApp({ dataDir: "unused", clientDir })).get("/api/nope");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
