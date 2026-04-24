type Severity = "DEBUG" | "INFO" | "WARNING" | "ERROR";

function log(severity: Severity, message: string, data?: Record<string, unknown>): void {
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
