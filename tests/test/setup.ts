import { vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.APP_BASE_URL = "http://localhost:3000";
process.env.CHAPA_SECRET_KEY = "CHASECK_TEST_test";
process.env.NEXT_PUBLIC_APP_BASE_URL = "http://localhost:3000";

// Mock console.error/warn to keep test output clean
vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
