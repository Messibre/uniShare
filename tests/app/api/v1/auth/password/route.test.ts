import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth } from "@/lib/auth-guard";
import { comparePassword, hashPassword } from "@/lib/bcrypt";

const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      endUser: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      refreshToken: {
        updateMany: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/auth-guard", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/bcrypt", () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
}));

import { PATCH } from "@/app/api/v1/auth/password/route";
import { makeRequest } from "@/tests/helpers";
import { createMockUser } from "@/tests/helpers/auth-mocks";

const mockedRequireAuth = vi.mocked(requireAuth);
const mockedComparePassword = vi.mocked(comparePassword);
const mockedHashPassword = vi.mocked(hashPassword);

describe("PATCH /api/v1/auth/password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = createMockUser({
    id: "user-1",
    email: "test@test.com",
  });

  it("should return 401 if not authenticated", async () => {
    mockedRequireAuth.mockRejectedValue(new Error("Unauthorized"));

    const req = makeRequest("/api/v1/auth/password", {
      method: "PATCH",
      body: { currentPassword: "old", newPassword: "new1234567" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("should return 400 if validation fails (missing field)", async () => {
    mockedRequireAuth.mockResolvedValue(mockUser);

    const req = makeRequest("/api/v1/auth/password", {
      method: "PATCH",
      body: { currentPassword: "old" },
    });
    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });

  it("should return 404 if user not found in DB", async () => {
    mockedRequireAuth.mockResolvedValue(mockUser);
    prismaMock.endUser.findUnique.mockResolvedValue(null);

    const req = makeRequest("/api/v1/auth/password", {
      method: "PATCH",
      body: { currentPassword: "old", newPassword: "new1234567" },
    });
    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("User not found");
  });

  it("should return 401 if current password is incorrect", async () => {
    mockedRequireAuth.mockResolvedValue(mockUser);
    prismaMock.endUser.findUnique.mockResolvedValue({
      passwordHash: "hashed_old",
    });
    mockedComparePassword.mockResolvedValue(false);

    const req = makeRequest("/api/v1/auth/password", {
      method: "PATCH",
      body: { currentPassword: "wrong", newPassword: "new1234567" },
    });
    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Current password is incorrect");
  });

  it("should update password and revoke refresh tokens on success", async () => {
    mockedRequireAuth.mockResolvedValue(mockUser);
    prismaMock.endUser.findUnique.mockResolvedValue({
      passwordHash: "hashed_old",
    });
    mockedComparePassword.mockResolvedValue(true);
    mockedHashPassword.mockResolvedValue("hashed_new");
    prismaMock.endUser.update.mockResolvedValue({ id: mockUser.id });
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const req = makeRequest("/api/v1/auth/password", {
      method: "PATCH",
      body: { currentPassword: "old", newPassword: "new1234567" },
    });
    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toContain("Password changed successfully");
    expect(prismaMock.endUser.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { passwordHash: "hashed_new" },
    });
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { EndUserId: mockUser.id, revoked: false },
      data: { revoked: true },
    });
  });
});
