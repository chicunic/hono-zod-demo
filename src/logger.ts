type Severity = "DEBUG" | "INFO" | "WARNING" | "ERROR";

const LEVEL_ORDER: Record<Severity, number> = { DEBUG: 10, INFO: 20, WARNING: 30, ERROR: 40 };

function currentMinLevel(): number {
  const raw = (process.env.LOG_LEVEL ?? "").toUpperCase();
  if (raw in LEVEL_ORDER) return LEVEL_ORDER[raw as Severity];
  if (process.env.NODE_ENV === "test") return LEVEL_ORDER.WARNING;
  return LEVEL_ORDER.INFO;
}

function log(severity: Severity, message: string, data?: Record<string, unknown>): void {
  if (LEVEL_ORDER[severity] < currentMinLevel()) return;
  const entry = { severity, message, timestamp: new Date().toISOString(), ...data };
  process.stdout.write(JSON.stringify(entry) + "\n");
}

export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => {
    log("DEBUG", message, data);
  },
  info: (message: string, data?: Record<string, unknown>) => {
    log("INFO", message, data);
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    log("WARNING", message, data);
  },
  error: (message: string, data?: Record<string, unknown>) => {
    log("ERROR", message, data);
  },
};
