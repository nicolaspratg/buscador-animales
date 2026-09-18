import path from "node:path";
import { z } from "zod";
import type { Animal } from "@shared/types.js";
import { readJsonFile } from "./jsonStore.js";

const animalSchema = z.object({
  id: z.number().int(),
  nombreComun: z.string(),
  nombreCientifico: z.string(),
  clase: z.string(),
  habitat: z.string(),
  dieta: z.string(),
  pesoPromedioKg: z.number(),
  esperanzaVidaAnios: z.number(),
  continente: z.string(),
  enPeligroExtincion: z.boolean(),
}) satisfies z.ZodType<Animal>;

export interface AnimalsRepository {
  findAll(): Promise<readonly Animal[]>;
}

export function createAnimalsRepository(dataDir: string): AnimalsRepository {
  const filePath = path.join(dataDir, "animals.json");
  // The dataset is read-only, so it is loaded once and kept in memory.
  let cache: Promise<readonly Animal[]> | undefined;

  return {
    findAll() {
      cache ??= readJsonFile(filePath, z.array(animalSchema));
      return cache;
    },
  };
}
