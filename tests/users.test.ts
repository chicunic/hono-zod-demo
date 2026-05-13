import { describe, expect, it } from "vitest";
import app from "../src/app.js";

const BASE = "/api/v1/users";

describe("Users routes", () => {
  describe("GET /users/:userId", () => {
    it("returns a user by ID", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const res = await app.request(`${BASE}/${userId}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        userId,
        email: "jane@doe.com",
        name: "Jane Doe",
        status: "Happy",
        phoneNumbers: [],
      });
    });

    it("supports name query parameter", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const res = await app.request(`${BASE}/${userId}?name=Alice`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("name", "Alice");
    });

    it("returns 404 for all-zero UUID", async () => {
      const res = await app.request(`${BASE}/00000000-0000-0000-0000-000000000000`);
      expect(res.status).toBe(404);
      expect(res.headers.get("content-type")).toContain("application/problem+json");
      const body = await res.json();
      expect(body).toEqual({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "User not found",
        instance: `${BASE}/00000000-0000-0000-0000-000000000000`,
      });
    });

    it("returns 400 for invalid UUID", async () => {
      const res = await app.request(`${BASE}/not-a-uuid`);
      expect(res.status).toBe(400);
      expect(res.headers.get("content-type")).toContain("application/problem+json");
      const body = (await res.json()) as { title: string; status: number; errors?: unknown };
      expect(body.title).toBe("Bad Request");
      expect(body.status).toBe(400);
      expect(body.errors).toBeInstanceOf(Array);
    });
  });

  describe("POST /users", () => {
    it("creates a new user", async () => {
      const res = await app.request(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "new@example.com",
          name: "New User",
          phoneNumbers: ["+12345678900"],
        }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toHaveProperty("userId");
      expect(body).toHaveProperty("email", "new@example.com");
      expect(body).toHaveProperty("name", "New User");
      expect(body).toHaveProperty("status", "Happy");
      expect(res.headers.get("Location")).toContain((body as { userId: string }).userId);
    });

    it("returns 409 for duplicate email", async () => {
      const res = await app.request(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "exists@example.com",
          name: "Existing User",
          phoneNumbers: [],
        }),
      });
      expect(res.status).toBe(409);
      expect(res.headers.get("content-type")).toContain("application/problem+json");
      const body = await res.json();
      expect(body).toEqual({
        type: "about:blank",
        title: "Conflict",
        status: 409,
        detail: "Email already exists",
        instance: BASE,
      });
    });

    it("returns 400 for invalid body", async () => {
      const res = await app.request(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      });
      expect(res.status).toBe(400);
      expect(res.headers.get("content-type")).toContain("application/problem+json");
      const body = (await res.json()) as { title: string; status: number; errors?: unknown };
      expect(body.title).toBe("Bad Request");
      expect(body.status).toBe(400);
      expect(body.errors).toBeInstanceOf(Array);
    });
  });
});
