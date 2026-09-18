import type { Animal, FiltrosDisponibles, Paginated } from "@shared/types.js";
import type { AnimalsRepository } from "../repositories/animals.repository.js";
import type { AnimalsQuery } from "../schemas/animals.schemas.js";

const collator = new Intl.Collator("es");

/** Lowercase and strip diacritics, so "leon" matches "León". */
export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function distinctSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort(collator.compare);
}

export function deriveFiltros(animals: readonly Animal[]): FiltrosDisponibles {
  const weights = animals.map((animal) => animal.pesoPromedioKg);
  return {
    clases: distinctSorted(animals.map((animal) => animal.clase)),
    dietas: distinctSorted(animals.map((animal) => animal.dieta)),
    continentes: distinctSorted(animals.map((animal) => animal.continente)),
    habitats: distinctSorted(animals.map((animal) => animal.habitat)),
    pesoMin: weights.length > 0 ? Math.min(...weights) : 0,
    pesoMax: weights.length > 0 ? Math.max(...weights) : 0,
  };
}

// Every check is `!== undefined`: pesoMin=0 and enPeligro=false are falsy but real filters.
function matches(animal: Animal, query: AnimalsQuery, nombre: string | undefined): boolean {
  if (nombre !== undefined && !normalizeText(animal.nombreComun).includes(nombre)) return false;
  if (query.clase !== undefined && !query.clase.includes(animal.clase)) return false;
  if (query.dieta !== undefined && !query.dieta.includes(animal.dieta)) return false;
  if (query.continente !== undefined && !query.continente.includes(animal.continente)) return false;
  if (query.habitat !== undefined && !query.habitat.includes(animal.habitat)) return false;
  if (query.pesoMin !== undefined && animal.pesoPromedioKg < query.pesoMin) return false;
  if (query.pesoMax !== undefined && animal.pesoPromedioKg > query.pesoMax) return false;
  if (query.enPeligro !== undefined && animal.enPeligroExtincion !== query.enPeligro) return false;
  return true;
}

function compareBy(orderBy: NonNullable<AnimalsQuery["orderBy"]>) {
  return (a: Animal, b: Animal): number =>
    orderBy === "nombreComun" ? collator.compare(a.nombreComun, b.nombreComun) : a[orderBy] - b[orderBy];
}

export interface AnimalsService {
  search(query: AnimalsQuery): Promise<Paginated<Animal>>;
  getFiltros(): Promise<FiltrosDisponibles>;
}

export function createAnimalsService(animals: AnimalsRepository): AnimalsService {
  let filtros: FiltrosDisponibles | undefined;

  return {
    async search(query) {
      const nombre = query.nombre === undefined ? undefined : normalizeText(query.nombre);
      const results = (await animals.findAll()).filter((animal) => matches(animal, query, nombre));

      if (query.orderBy !== undefined) {
        const compare = compareBy(query.orderBy);
        const direction = query.order === "desc" ? -1 : 1;
        // id as tie-breaker keeps the order stable across pages.
        results.sort((a, b) => direction * compare(a, b) || a.id - b.id);
      }

      const { page, limit } = query;
      return {
        data: results.slice((page - 1) * limit, page * limit),
        meta: { total: results.length, page, limit, totalPages: Math.ceil(results.length / limit) },
      };
    },

    async getFiltros() {
      filtros ??= deriveFiltros(await animals.findAll());
      return filtros;
    },
  };
}
