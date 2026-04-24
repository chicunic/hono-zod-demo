import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      JWT_SECRET: "test-jwt-secret",
      SESSION_SECRET: "test-session-secret",
    },
  },
});
