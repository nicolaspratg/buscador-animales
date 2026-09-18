import type { RequestHandler } from "express";
import type { Animal, FiltrosDisponibles, Paginated } from "@shared/types.js";
import { animalsQuerySchema } from "../schemas/animals.schemas.js";
import { parseInput } from "../schemas/parse.js";
import type { AnimalsService } from "../services/animals.service.js";

export function createAnimalsController(animals: AnimalsService) {
  const search: RequestHandler<unknown, Paginated<Animal>> = async (req, res) => {
    const query = parseInput(animalsQuerySchema, req.query, "Parámetros de búsqueda inválidos");
    res.json(await animals.search(query));
  };

  const filtros: RequestHandler<unknown, FiltrosDisponibles> = async (_req, res) => {
    res.json(await animals.getFiltros());
  };

  return { search, filtros };
}
