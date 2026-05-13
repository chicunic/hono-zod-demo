import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { sign, verify } from "hono/jwt";
import { config } from "../config.js";
import { EXAMPLE_EMAIL, EXAMPLE_UUID, defaultHook, jsonError } from "../schemas.js";

const { NODE_ENV, JWT_SECRET, JWT_EXPIRES_IN, SESSION_SECRET } = config;
const SESSION_COOKIE = "session";

const LoginParamsSchema = z
  .object({
    userId: z.uuid().meta({ description: "User ID (UUID)", example: EXAMPLE_UUID }),
    email: z.email().meta({ description: "Email address", example: EXAMPLE_EMAIL }),
  })
  .meta({ id: "LoginParams" });

type LoginParams = z.infer<typeof LoginParamsSchema>;

interface Env {
  Variables: {
    jwtPayload: LoginParams & Record<string, unknown>;
    session: LoginParams;
  };
}

const JwtLoginResponseSchema = LoginParamsSchema.extend({
  jwtToken: z.string().meta({
    description: "JWT bearer token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  }),
}).meta({ id: "JwtLoginResponse" });

const jwtAuth = createMiddleware<Env>(async (c, next) => {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) throw new HTTPException(401, { message: "Authorization header missing" });
  try {
    c.set("jwtPayload", await verify(token, JWT_SECRET, "HS256"));
  } catch {
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }
  await next();
});

const sessionAuth = createMiddleware<Env>(async (c, next) => {
  const cookie = await getSignedCookie(c, SESSION_SECRET, SESSION_COOKIE);
  if (!cookie) throw new HTTPException(401, { message: "Unauthorized" });
  c.set("session", JSON.parse(cookie) as LoginParams);
  await next();
});

const app = new OpenAPIHono<Env>({ defaultHook: defaultHook() });

app.openAPIRegistry.registerComponent("securitySchemes", "session", {
  type: "apiKey",
  in: "cookie",
  name: SESSION_COOKIE,
  description: "Signed session cookie",
});

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT bearer token",
});

app.openapi(
  createRoute({
    method: "post",
    path: "/session",
    summary: "Create a session",
    tags: ["Auth"],
    request: {
      body: {
        content: { "application/json": { schema: LoginParamsSchema } },
        description: "Login credentials",
        required: true,
      },
    },
    responses: {
      201: { content: { "application/json": { schema: LoginParamsSchema } }, description: "Session created" },
      400: jsonError("Validation error"),
    },
  }),
  async (c) => {
    const body = c.req.valid("json");
    await setSignedCookie(c, SESSION_COOKIE, JSON.stringify(body), SESSION_SECRET, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 86400,
      path: "/",
    });
    return c.json(body, 201);
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/session",
    summary: "Delete the current session",
    tags: ["Auth"],
    security: [{ session: [] }],
    middleware: [sessionAuth],
    responses: {
      204: { description: "Session deleted" },
      401: jsonError("Unauthorized"),
    },
  }),
  (c) => {
    deleteCookie(c, SESSION_COOKIE);
    return c.body(null, 204);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/session",
    summary: "Get current session data",
    tags: ["Auth"],
    security: [{ session: [] }],
    middleware: [sessionAuth],
    responses: {
      200: { content: { "application/json": { schema: LoginParamsSchema } }, description: "Session data" },
      401: jsonError("Unauthorized"),
    },
  }),
  (c) => {
    const { userId, email } = c.get("session");
    return c.json({ userId, email }, 200);
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/token",
    summary: "Create a JWT token",
    tags: ["Auth"],
    request: {
      body: {
        content: { "application/json": { schema: LoginParamsSchema } },
        description: "Login credentials",
        required: true,
      },
    },
    responses: {
      201: { content: { "application/json": { schema: JwtLoginResponseSchema } }, description: "Token created" },
      400: jsonError("Validation error"),
    },
  }),
  async (c) => {
    const { userId, email } = c.req.valid("json");
    const now = Math.floor(Date.now() / 1000);
    const jwtToken = await sign({ userId, email, iat: now, exp: now + JWT_EXPIRES_IN }, JWT_SECRET);
    return c.json({ userId, email, jwtToken }, 201);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/token",
    summary: "Get current token data",
    description:
      "Put the JWT token in the Authorization header as a Bearer token. Use POST /auth/token to obtain a token first.",
    tags: ["Auth"],
    security: [{ Bearer: [] }],
    middleware: [jwtAuth],
    responses: {
      200: { content: { "application/json": { schema: LoginParamsSchema } }, description: "Token data" },
      401: jsonError("Unauthorized"),
    },
  }),
  (c) => {
    const { userId, email } = c.get("jwtPayload");
    return c.json({ userId, email }, 200);
  },
);

export default app;
