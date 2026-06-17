import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { config } from "./config.js";
import { AppError, appErrorToProblem } from "./errors.js";
import { logger } from "./logger.js";
import authApp from "./routes/auth.js";
import usersApp from "./routes/users.js";
import { defaultHook, problemResponse } from "./schemas.js";

const app = new OpenAPIHono({ defaultHook: defaultHook() });

app.use("*", secureHeaders());
app.use("*", cors());

app.notFound((c) => problemResponse(c, 404, "Route not found"));

app.onError((err, c) => {
  if (err instanceof AppError) return appErrorToProblem(err, c);
  if (err instanceof HTTPException) return problemResponse(c, err.status, err.message);
  logger.error("Unhandled error", { message: err.message, stack: err.stack });
  return problemResponse(c, 500, "Internal server error");
});

app.get("/", (c) => c.json({ name: "Hono + Zod OpenAPI Demo", version: "0.0.1" }));
app.get("/health", (c) => c.json({ status: "ok" }));

app.route(`${config.ROUTE_PREFIX}/users`, usersApp);
app.route(`${config.ROUTE_PREFIX}/auth`, authApp);

app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Hono + Zod OpenAPI Demo",
    version: "0.0.1",
    description: "Demo of Hono with Zod OpenAPI and Swagger UI. Errors follow RFC 9457 (Problem Details).",
    license: { name: "MIT" },
  },
  servers: [{ url: `http://localhost:${config.PORT}`, description: "Local" }],
});

app.get("/docs", swaggerUI({ url: "/openapi.json" }));

export default app;
