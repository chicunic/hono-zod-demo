import { describe, expect, it } from "vitest";
import app from "../src/app.js";
import { RestTestHelper, restAssert } from "./utils/rest.js";

const BASE = "/api/v1/auth";
const credentials = {
  userId: "550e8400-e29b-41d4-a716-446655440000",
  email: "jane@doe.com",
};

const rest = new RestTestHelper(app);

describe("Auth routes", () => {
  describe("JWT token", () => {
    it("POST /auth/token creates a token", async () => {
      const res = await rest.post(`${BASE}/token`, credentials);
      restAssert.expectSuccess(res, 201);
      expect(res.body).toHaveProperty("jwtToken");
      expect(res.body).toHaveProperty("userId", credentials.userId);
      expect(res.body).toHaveProperty("email", credentials.email);
    });

    it("GET /auth/token returns payload with valid token", async () => {
      const tokenRes = await rest.post(`${BASE}/token`, credentials);
      const { jwtToken } = tokenRes.body as { jwtToken: string };

      const res = await rest.get(`${BASE}/token`, { Authorization: `Bearer ${jwtToken}` });
      restAssert.expectSuccess(res);
      expect(res.body).toEqual(credentials);
    });

    it("GET /auth/token returns 401 without token", async () => {
      const res = await rest.get(`${BASE}/token`);
      restAssert.expectError(res, 401);
    });

    it("GET /auth/token returns 401 with invalid token", async () => {
      const res = await rest.get(`${BASE}/token`, { Authorization: "Bearer invalid-token" });
      restAssert.expectError(res, 401);
    });

    it("POST /auth/token returns 400 for invalid body", async () => {
      const res = await rest.post(`${BASE}/token`, { email: "not-valid" });
      restAssert.expectError(res, 400);
    });
  });

  describe("Session", () => {
    it("POST /auth/session creates a session", async () => {
      const res = await rest.post(`${BASE}/session`, credentials);
      restAssert.expectSuccess(res, 201);
      expect(res.body).toEqual(credentials);
      expect(res.headers.get("Set-Cookie")).toContain("session=");
    });

    it("GET /auth/session returns session data with cookie", async () => {
      const loginRes = await rest.post(`${BASE}/session`, credentials);
      const cookie = loginRes.headers.get("Set-Cookie") ?? "";

      const res = await rest.get(`${BASE}/session`, { Cookie: cookie });
      restAssert.expectSuccess(res);
      expect(res.body).toEqual(credentials);
    });

    it("GET /auth/session returns 401 without cookie", async () => {
      const res = await rest.get(`${BASE}/session`);
      restAssert.expectError(res, 401);
    });

    it("DELETE /auth/session clears the session", async () => {
      const loginRes = await rest.post(`${BASE}/session`, credentials);
      const cookie = loginRes.headers.get("Set-Cookie") ?? "";

      const res = await rest.delete(`${BASE}/session`, { Cookie: cookie });
      restAssert.expectSuccess(res, 204);
    });
  });
});
