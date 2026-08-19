import { afterEach, vi } from "vitest";

process.env.JWT_ACCESS_SECRET ??= "test-access-secret";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret";
process.env.CHAPA_SECRET_KEY ??= "test-chapa-secret";
process.env.RESEND_API_KEY ??= "test-resend-key";
process.env.EMAIL_FROM ??= "noreply@unishare.test";
process.env.APP_BASE_URL ??= "http://localhost:3000";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
// process.env.NODE_ENV ??= "test";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
