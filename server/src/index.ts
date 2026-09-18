import { env } from "./config/env.js";
import { createApp } from "./app.js";

createApp({ dataDir: env.dataDir }).listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
