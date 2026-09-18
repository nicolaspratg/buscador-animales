import { env } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp({
  dataDir: env.dataDir,
  ...(env.clientDir !== undefined && { clientDir: env.clientDir }),
});

app.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port}`);
});
