import pino from "pino";

const VALID_LEVELS = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
  "silent",
] as const;

const configuredLevel = process.env.LOG_LEVEL?.trim().toLowerCase();
const fallbackLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

const LOG_LEVEL =
  configuredLevel && VALID_LEVELS.includes(configuredLevel as (typeof VALID_LEVELS)[number])
    ? configuredLevel
    : fallbackLevel;

export const logger = pino({
  level: LOG_LEVEL,
  base: {
    env: process.env.NODE_ENV || "development",
    service: "unishare-api",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: true,
            ignore: "pid,hostname",
            singleLine: true,
          },
        }
      : undefined,
});

export function createRequestLogger(req: Request) {
  const url = new URL(req.url);
  return logger.child({
    method: req.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
  });
}
