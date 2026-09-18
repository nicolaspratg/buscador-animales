import { Router } from "express";
import type { createAuthController } from "../controllers/auth.controller.js";

export function authRoutes(controller: ReturnType<typeof createAuthController>): Router {
  const router = Router();
  router.post("/signup", controller.signup);
  router.post("/login", controller.login);
  return router;
}
