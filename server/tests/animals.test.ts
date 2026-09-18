import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { Animal } from "@shared/types.js";
import { createTestApp, signupAndGetToken } from "./helpers.js";

let ctx: Awaited<ReturnType<typeof createTestApp>>;
let token: string;

// The dataset is read-only, so one app and one user serve the whole file.
beforeAll(async () => {
  ctx = await createTestApp();
  token = await signupAndGetToken(ctx.app);
});
afterAll(() => ctx.cleanup());

function search(query: string) {
  return request(ctx.app).get(`/api/animales?${query}`).set("Authorization", `Bearer ${token}`);
}

const names = (body: { data: Animal[] }) => body.data.map((animal) => animal.nombreComun);

describe("GET /api/animales auth", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects a request without a token", async () => {
    const res = await request(ctx.app).get("/api/animales");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects a malformed token", async () => {
    const res = await request(ctx.app).get("/api/animales").set("Authorization", "Bearer not.a.jwt");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects an expired token", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000);

    const res = await search("");

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({ code: "UNAUTHORIZED", message: "La sesión expiró" });
  });
});

describe("GET /api/animales filters", () => {
  it("returns the first page of all 30 animals by default", async () => {
    const res = await search("");

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ total: 30, page: 1, limit: 10, totalPages: 3 });
    expect(res.body.data).toHaveLength(10);
  });

  it("matches nombre partially and ignoring accents and case", async () => {
    const res = await search("nombre=leon");

    expect(names(res.body).sort()).toEqual(["Camaleón pantera", "León"]);
  });

  it("treats pesoMax as inclusive", async () => {
    const res = await search("pesoMax=1&limit=100");

    expect(res.body.meta.total).toBe(10);
    expect(names(res.body)).toContain("Guacamayo rojo");
  });

  it("applies pesoMin=0 instead of dropping it as falsy", async () => {
    const res = await search("pesoMin=0");

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(30);
  });

  it("applies enPeligro=false instead of dropping it as falsy", async () => {
    const res = await search("enPeligro=false&limit=100");

    expect(res.body.meta.total).toBe(14);
    expect(res.body.data.every((animal: Animal) => !animal.enPeligroExtincion)).toBe(true);
  });

  it("returns 200 with an empty list when nothing matches", async () => {
    const res = await search("clase=Insecto&continente=Asia");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it("combines filters", async () => {
    const res = await search("clase=Ave&dieta=Omnívoro");

    expect(names(res.body).sort()).toEqual(["Avestruz", "Guacamayo rojo"]);
  });

  it("rejects pesoMin greater than pesoMax", async () => {
    const res = await search("pesoMin=100&pesoMax=10");

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe("pesoMin");
  });

  it("rejects a non-numeric weight instead of ignoring it", async () => {
    const res = await search("pesoMin=abc");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("sorts names with Spanish collation, accented names in place", async () => {
    const res = await search("orderBy=nombreComun&limit=3");

    expect(names(res.body)).toEqual(["Abeja europea", "Águila calva", "Atún rojo"]);
  });

  it("sorts by weight descending", async () => {
    const res = await search("orderBy=pesoPromedioKg&order=desc&limit=2");

    expect(names(res.body)).toEqual(["Elefante africano", "Tiburón blanco"]);
  });
});

describe("GET /api/animales/filtros", () => {
  it("derives sorted distinct values and weight bounds from the dataset", async () => {
    const res = await request(ctx.app).get("/api/animales/filtros").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      clases: ["Anfibio", "Ave", "Insecto", "Mamífero", "Pez", "Reptil"],
      dietas: ["Carnívoro", "Herbívoro", "Omnívoro"],
      continentes: ["África", "América", "Antártida", "Asia", "Europa", "Oceanía"],
      habitats: ["Bosque", "Desierto", "Isla", "Montaña", "Océano", "Polar", "Río", "Sabana", "Selva"],
      pesoMin: 0.0001,
      pesoMax: 5000,
    });
  });

  it("is protected", async () => {
    const res = await request(ctx.app).get("/api/animales/filtros");

    expect(res.status).toBe(401);
  });
});
