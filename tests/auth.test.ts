import { describe, expect, it } from "vitest";
import app from "../src/app.js";

const BASE = "/api/v1/auth";
const credentials = {
  userId: "550e8400-e29b-41d4-a716-446655440000",
  email: "jane@doe.com",
};

describe("Auth routes", () => {
  describe("JWT token", () => {
    it("POST /auth/token creates a token", async () => {
      const res = await app.request(`${BASE}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toHaveProperty("jwtToken");
      expect(body).toHaveProperty("userId", credentials.userId);
      expect(body).toHaveProperty("email", credentials.email);
    });

    it("GET /auth/token returns payload with valid token", async () => {
      const tokenRes = await app.request(`${BASE}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const { jwtToken } = (await tokenRes.json()) as { jwtToken: string };

      const res = await app.request(`${BASE}/token`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(credentials);
    });

    it("GET /auth/token returns 401 without token", async () => {
      const res = await app.request(`${BASE}/token`);
      expect(res.status).toBe(401);
    });

    it("GET /auth/token returns 401 with invalid token", async () => {
      const res = await app.request(`${BASE}/token`, {
        headers: { Authorization: "Bearer invalid-token" },
      });
      expect(res.status).toBe(401);
    });

    it("POST /auth/token returns 400 for invalid body", async () => {
      const res = await app.request(`${BASE}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-valid" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("Session", () => {
    it("POST /auth/session creates a session", async () => {
      const res = await app.request(`${BASE}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toEqual(credentials);
      expect(res.headers.get("Set-Cookie")).toContain("session=");
    });

    it("GET /auth/session returns session data with cookie", async () => {
      const loginRes = await app.request(`${BASE}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const cookie = loginRes.headers.get("Set-Cookie") ?? "";

      const res = await app.request(`${BASE}/session`, {
        headers: { Cookie: cookie },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(credentials);
    });

    it("GET /auth/session returns 401 without cookie", async () => {
      const res = await app.request(`${BASE}/session`);
      expect(res.status).toBe(401);
    });

    it("DELETE /auth/session clears the session", async () => {
      const loginRes = await app.request(`${BASE}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const cookie = loginRes.headers.get("Set-Cookie") ?? "";

      const res = await app.request(`${BASE}/session`, {
        method: "DELETE",
        headers: { Cookie: cookie },
      });
      expect(res.status).toBe(204);
    });
  });
});
