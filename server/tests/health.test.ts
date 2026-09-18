import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp } from "./helpers.js";

let ctx: Awaited<ReturnType<typeof createTestApp>>;
beforeEach(async () => {
  ctx = await createTestApp();
});
afterEach(() => ctx.cleanup());

describe("GET /api/health", () => {
  it("responds ok without auth", async () => {
    const res = await request(ctx.app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
    expect(typeof res.body.uptime).toBe("number");
  });

  it("returns the error envelope for unknown API routes", async () => {
    const res = await request(ctx.app).get("/api/nope");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
