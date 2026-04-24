import { z } from "@hono/zod-openapi";

const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  ROUTE_PREFIX: z.string().startsWith("/").default("/api/v1"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET must be set"),
  JWT_EXPIRES_IN: z.coerce.number().int().positive().default(3600),
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET must be set"),
});

const parsed = ConfigSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const config = parsed.data;
