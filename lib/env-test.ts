import { env } from "./env";

export function isTest(): boolean {
  return env.NODE_ENV === "test" || process.env.VITEST === "true";
}

export function skipEnvValidation(): boolean {
  return isTest() || process.env.SKIP_ENV_VALIDATION === "true";
}
