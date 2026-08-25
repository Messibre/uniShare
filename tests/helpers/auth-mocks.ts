import { vi } from "vitest";
import { requireAuth, requireAdmin } from "@/lib/auth-guard";
import { EndUser, Role } from "@/lib/generated/prisma";

export type AuthUser = Omit<EndUser, "passwordHash">;

export function createMockUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "test-user-1",
    fullName: "Test Student",
    email: "student@test.com",
    phone: "+251900000000",
    role: "STUDENT" as Role,
    isIdVerified: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockAdmin(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "test-admin-1",
    fullName: "Test Admin",
    email: "admin@test.com",
    phone: "+251900000000",
    role: "ADMIN" as Role,
    isIdVerified: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function mockRequireAuth(user: AuthUser) {
  vi.mocked(requireAuth).mockResolvedValue(user);
}

export function mockRequireAuthUnauthorized() {
  vi.mocked(requireAuth).mockRejectedValue(new Error("Unauthorized"));
}

export function mockRequireAuthUnverified() {
  const user = createMockUser({ isIdVerified: false });
  vi.mocked(requireAuth).mockResolvedValue(user);
}

export function mockRequireAdmin(admin: AuthUser) {
  vi.mocked(requireAdmin).mockResolvedValue(admin);
}

export function mockRequireAdminForbidden() {
  vi.mocked(requireAdmin).mockRejectedValue(
    new Error("Forbidden – Admin access required"),
  );
}
