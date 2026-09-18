import type { Animal, FiltrosDisponibles, Paginated } from "@shared/types";
import { apiRequest } from "./client";

export function fetchAnimals(query: string, signal: AbortSignal): Promise<Paginated<Animal>> {
  return apiRequest(`/api/animales${query === "" ? "" : `?${query}`}`, { signal });
}

export function fetchFiltros(signal: AbortSignal): Promise<FiltrosDisponibles> {
  return apiRequest("/api/animales/filtros", { signal });
}
