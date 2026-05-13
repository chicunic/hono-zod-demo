import { serve } from "@hono/node-server";
import app from "./app.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

serve({ fetch: app.fetch, port: config.PORT }, () => {
  const baseUrl = `http://localhost:${config.PORT}`;
  logger.info("Server started", { server: baseUrl, docs: `${baseUrl}/docs` });
});
