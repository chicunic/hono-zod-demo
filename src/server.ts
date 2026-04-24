import { serve } from "@hono/node-server";
import { config } from "./config.js";
import { logger } from "./logger.js";
import app from "./app.js";

const { PORT: port } = config;
const baseUrl = `http://localhost:${String(port)}`;

serve({ fetch: app.fetch, port }, () => {
  logger.info("Server started", { server: baseUrl, docs: `${baseUrl}/docs` });
});
