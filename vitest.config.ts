import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: {
      JWT_SECRET: "test-jwt-secret",
      SESSION_SECRET: "test-session-secret",
    },
    setupFiles: ["./tests/setup.ts"],
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/server.ts"],
    },
  },
});
