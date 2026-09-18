import { Router } from "express";
import type { createAnimalsController } from "../controllers/animals.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export function animalsRoutes(controller: ReturnType<typeof createAnimalsController>): Router {
  const router = Router();
  router.use(authenticate);
  router.get("/", controller.search);
  router.get("/filtros", controller.filtros);
  return router;
}
