// Global test setup (wired via `setupFiles`); silences `console.error` lines tagged "[expected]" so intentional errors stay quiet while real ones surface.

const originalConsoleError = console.error;

beforeAll(() => {
  console.error = vi.fn((...args: unknown[]) => {
    const firstArg = typeof args[0] === "string" ? args[0] : "";
    if (firstArg.includes("[expected]")) return;
    originalConsoleError(...args);
  });
});

afterAll(() => {
  console.error = originalConsoleError;
});

export {};
