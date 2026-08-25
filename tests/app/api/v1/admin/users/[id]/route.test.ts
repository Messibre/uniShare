import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAdmin } from "@/lib/auth-guard";

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
      $transaction: vi.fn(),
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/auth-guard", () => ({
  requireAdmin: vi.fn(),
}));

import { DELETE } from "@/app/api/v1/admin/users/[id]/route";
import { makeRequest } from "@/tests/helpers";
import { createMockAdmin } from "@/tests/helpers/auth-mocks";

const mockedRequireAdmin = vi.mocked(requireAdmin);

describe("DELETE /api/v1/admin/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const adminUser = createMockAdmin({ id: "admin-1" });

  it("should return 401 if not authenticated", async () => {
    mockedRequireAdmin.mockRejectedValue(new Error("Unauthorized"));

    const req = makeRequest("/api/v1/admin/users/user-123", {
      method: "DELETE",
    });
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "user-123" }),
    });
    expect(res.status).toBe(401);
  });

  it("should return 403 if not admin", async () => {
    mockedRequireAdmin.mockRejectedValue(
      new Error("Forbidden – Admin access required"),
    );

    const req = makeRequest("/api/v1/admin/users/user-123", {
      method: "DELETE",
    });
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "user-123" }),
    });
    expect(res.status).toBe(403);
  });

  it("should return 400 when admin tries to delete themselves", async () => {
    mockedRequireAdmin.mockResolvedValue({ ...adminUser, id: "user-123" });

    const req = makeRequest("/api/v1/admin/users/user-123", {
      method: "DELETE",
    });
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "user-123" }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("cannot delete your own account");
  });

  it("should return 404 if user not found", async () => {
    mockedRequireAdmin.mockResolvedValue(adminUser);
    prismaMock.endUser.findUnique.mockResolvedValue(null);

    const req = makeRequest("/api/v1/admin/users/missing", {
      method: "DELETE",
    });
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "missing" }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("User not found");
  });

  it("should return 409 if user already deleted", async () => {
    mockedRequireAdmin.mockResolvedValue(adminUser);
    prismaMock.endUser.findUnique.mockResolvedValue({
      id: "user-123",
      deletedAt: new Date(),
    });

    const req = makeRequest("/api/v1/admin/users/user-123", {
      method: "DELETE",
    });
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "user-123" }),
    });
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toBe("User already deleted");
  });

  it("should soft delete user and revoke refresh tokens", async () => {
    mockedRequireAdmin.mockResolvedValue(adminUser);
    prismaMock.endUser.findUnique.mockResolvedValue({
      id: "user-123",
      deletedAt: null,
    });
    prismaMock.$transaction.mockResolvedValue([{}, {}]);

    const req = makeRequest("/api/v1/admin/users/user-123", {
      method: "DELETE",
    });
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "user-123" }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("User deleted successfully");
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });
});
