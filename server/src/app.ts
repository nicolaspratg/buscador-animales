import express from "express";
import type { HealthResponse } from "@shared/types.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    const body: HealthResponse = { status: "ok", uptime: process.uptime() };
    res.json(body);
  });

  return app;
}
