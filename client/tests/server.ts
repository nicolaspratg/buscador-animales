import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { Animal, AuthResponse, FiltrosDisponibles, Paginated } from "@shared/types";

export const FILTROS: FiltrosDisponibles = {
  clases: ["Ave", "Mamífero"],
  dietas: ["Carnívoro", "Herbívoro"],
  continentes: ["África", "América", "Asia"],
  habitats: ["Sabana", "Selva"],
  pesoMin: 0.0001,
  pesoMax: 5000,
};

export const LEON: Animal = {
  id: 1,
  nombreComun: "León",
  nombreCientifico: "Panthera leo",
  clase: "Mamífero",
  habitat: "Sabana",
  dieta: "Carnívoro",
  pesoPromedioKg: 190,
  esperanzaVidaAnios: 14,
  continente: "África",
  enPeligroExtincion: true,
};

export function page(data: Animal[]): Paginated<Animal> {
  return { data, meta: { total: data.length, page: 1, limit: 10, totalPages: data.length === 0 ? 0 : 1 } };
}

export const server = setupServer(
  http.get("*/api/animales/filtros", () => HttpResponse.json(FILTROS)),
  http.get("*/api/animales", () => HttpResponse.json(page([LEON]))),
);

/** A token whose payload is readable and unexpired; the mocked API never verifies it. */
export function fakeSession(): AuthResponse {
  const payload = btoa(JSON.stringify({ sub: "1", email: "nico@example.com", exp: Date.now() / 1000 + 3600 }));
  return { token: `header.${payload}.signature`, user: { id: 1, email: "nico@example.com" } };
}

export function signIn() {
  localStorage.setItem("buscador-animales.session", JSON.stringify(fakeSession()));
}
