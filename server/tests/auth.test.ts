import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp } from "./helpers.js";

let ctx: Awaited<ReturnType<typeof createTestApp>>;
beforeEach(async () => {
  ctx = await createTestApp();
});
afterEach(() => ctx.cleanup());

const signup = (body: object) => request(ctx.app).post("/api/auth/signup").send(body);
const login = (body: object) => request(ctx.app).post("/api/auth/login").send(body);

describe("POST /api/auth/signup", () => {
  it("creates the user, returns a token, and never stores or returns the password", async () => {
    const res = await signup({ email: "  Nico@Example.com ", password: "secret123" });

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toEqual({ id: 1, email: "nico@example.com" });

    const stored = JSON.stringify(await ctx.readUsersFile());
    expect(stored).not.toContain("secret123");
    expect(stored).toContain("$2b$10$");
  });

  it("rejects an invalid email with field details", async () => {
    const res = await signup({ email: "not-an-email", password: "secret123" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual([{ field: "email", message: "Email inválido" }]);
  });

  it("rejects a 5-character password", async () => {
    const res = await signup({ email: "a@b.com", password: "12345" });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe("password");
  });

  it("rejects a duplicate email regardless of case", async () => {
    await signup({ email: "a@b.com", password: "secret123" });
    const res = await signup({ email: "A@B.com", password: "other-pass" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("keeps every user when signups run concurrently", async () => {
    const emails = Array.from({ length: 15 }, (_, i) => `user${i}@example.com`);
    const responses = await Promise.all(emails.map((email) => signup({ email, password: "secret123" })));

    expect(responses.every((res) => res.status === 201)).toBe(true);
    const users = await ctx.readUsersFile();
    expect(Array.isArray(users) && users.length).toBe(15);
  });

  it("lets exactly one of several concurrent signups with the same email through", async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => signup({ email: "race@example.com", password: "secret123" })),
    );

    expect(responses.map((res) => res.status).sort()).toEqual([201, 409, 409, 409, 409]);
  });

  it("returns 400, not 500, for a malformed JSON body", async () => {
    const res = await request(ctx.app)
      .post("/api/auth/signup")
      .set("Content-Type", "application/json")
      .send("{ not json");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await signup({ email: "nico@example.com", password: "secret123" });
  });

  it("logs in with correct credentials", async () => {
    const res = await login({ email: "NICO@example.com", password: "secret123" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toEqual({ id: 1, email: "nico@example.com" });
  });

  it("returns the identical 401 body for a wrong password and an unknown email", async () => {
    const wrongPassword = await login({ email: "nico@example.com", password: "wrong-pass" });
    const unknownEmail = await login({ email: "ghost@example.com", password: "secret123" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual({
      error: { code: "INVALID_CREDENTIALS", message: "Email o contraseña incorrectos" },
    });
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });
});
