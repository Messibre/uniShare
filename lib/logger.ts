import pino from "pino";

const LOG_LEVEL =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

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
