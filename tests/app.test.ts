import { describe, expect, it } from "vitest";
import app from "../src/app.js";

describe("Root routes", () => {
  it("GET / returns app info", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: "Hono + Zod OpenAPI Demo", version: "0.0.1" });
  });

  it("GET /health returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("GET /openapi.json returns OpenAPI spec", async () => {
    const res = await app.request("/openapi.json");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("openapi", "3.1.0");
    expect(body).toHaveProperty("info.title", "Hono + Zod OpenAPI Demo");
  });

  it("GET /unknown returns 404", async () => {
    const res = await app.request("/unknown");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: { name: "NotFound", message: "Route not found" },
    });
  });
});
