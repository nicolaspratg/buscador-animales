import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Must match the server's PORT. The proxy keeps the API same-origin in dev, so no CORS.
const API_ORIGIN = "http://localhost:3001";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@shared": fileURLToPath(new URL("../shared", import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: { "/api": API_ORIGIN },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
});
