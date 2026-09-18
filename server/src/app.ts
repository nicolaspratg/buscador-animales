import express from "express";
import type { HealthResponse } from "@shared/types.js";
import { createAuthController } from "./controllers/auth.controller.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { createUsersRepository } from "./repositories/users.repository.js";
import { authRoutes } from "./routes/auth.routes.js";
import { createAuthService } from "./services/auth.service.js";

export interface AppOptions {
  /** Folder holding animals.json and users.json. Tests point this at a temp copy. */
  dataDir: string;
}

// Composition root: the only place layers are wired together. Swapping the JSON
// repository for a database means changing the create*Repository call.
export function createApp({ dataDir }: AppOptions) {
  const authService = createAuthService(createUsersRepository(dataDir));

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  app.get("/api/health", (_req, res) => {
    const body: HealthResponse = { status: "ok", uptime: process.uptime() };
    res.json(body);
  });
  app.use("/api/auth", authRoutes(createAuthController(authService)));
  app.use("/api", notFound);


  app.use(errorHandler);
  return app;
}
