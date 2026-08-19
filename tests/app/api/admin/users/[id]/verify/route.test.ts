import { describe, it, expect, beforeEach, vi } from "vitest";
import { PATCH } from "@/app/api/admin/users/[id]/verify/route";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";

const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      endUser: {
        update: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/auth-guard", () => ({
  requireAdmin: vi.fn(),
}));

const mockedUpdate = vi.mocked(prismaMock.endUser.update);

describe("PATCH /api/admin/users/[id]/verify – Verify User", () => {
  const mockUser = {
    id: "user-123",
    fullName: "Test User",
    email: "test@example.com",
    isIdVerified: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should verify a user when admin sends verified: true", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (mockedUpdate as any).mockResolvedValue(mockUser);

    const req = new NextRequest(
      "http://localhost:3000/api/admin/users/user-123/verify",
      {
        method: "PATCH",
        body: JSON.stringify({ verified: true }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await PATCH(req, {
      params: Promise.resolve({ id: "user-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.isIdVerified).toBe(true);
    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: "user-123" },
      data: { isIdVerified: true },
      select: { id: true, fullName: true, email: true, isIdVerified: true },
    });
  });

  it("should unverify a user when admin sends verified: false", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (mockedUpdate as any).mockResolvedValue({
      ...mockUser,
      isIdVerified: false,
    });

    const req = new NextRequest(
      "http://localhost:3000/api/admin/users/user-123/verify",
      {
        method: "PATCH",
        body: JSON.stringify({ verified: false }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await PATCH(req, {
      params: Promise.resolve({ id: "user-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.isIdVerified).toBe(false);
  });

  it("should return 400 if verified field is missing", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });

    const req = new NextRequest(
      "http://localhost:3000/api/admin/users/user-123/verify",
      {
        method: "PATCH",
        body: JSON.stringify({ something: "else" }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await PATCH(req, {
      params: Promise.resolve({ id: "user-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("verified must be a boolean");
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("should return 400 if verified is not a boolean", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });

    const req = new NextRequest(
      "http://localhost:3000/api/admin/users/user-123/verify",
      {
        method: "PATCH",
        body: JSON.stringify({ verified: "true" }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await PATCH(req, {
      params: Promise.resolve({ id: "user-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("verified must be a boolean");
  });

  it("should return 403 if not admin", async () => {
    (requireAdmin as any).mockRejectedValue(
      new Error("Forbidden – Admin access required"),
    );

    const req = new NextRequest(
      "http://localhost:3000/api/admin/users/user-123/verify",
      {
        method: "PATCH",
        body: JSON.stringify({ verified: true }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await PATCH(req, {
      params: Promise.resolve({ id: "user-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should handle user not found error", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (mockedUpdate as any).mockRejectedValue(
      new Error("Record to update not found"),
    );

    const req = new NextRequest(
      "http://localhost:3000/api/admin/users/user-999/verify",
      {
        method: "PATCH",
        body: JSON.stringify({ verified: true }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await PATCH(req, {
      params: Promise.resolve({ id: "user-123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
