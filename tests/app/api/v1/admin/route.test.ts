import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/v1/admin/route";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

vi.mock("@/lib/prisma", () => ({
  default: {
    endUser: { count: vi.fn() },
    rental: { count: vi.fn() },
    item: { count: vi.fn() },
  },
}));

vi.mock("@/lib/auth-guard", () => ({
  requireAdmin: vi.fn(),
}));

describe("GET /api/admin – Admin Dashboard Stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return dashboard stats for admin", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });

    (prisma.endUser.count as any).mockResolvedValue(150);
    (prisma.rental.count as any)
      .mockResolvedValueOnce(320) // total rentals
      .mockResolvedValueOnce(45); // pending rentals
    (prisma.item.count as any)
      .mockResolvedValueOnce(210) // total items
      .mockResolvedValueOnce(30); // platform items

    const req = new NextRequest("http://localhost:3000/api/admin", {
      method: "GET",
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toEqual({
      totalUsers: 150,
      totalRentals: 320,
      totalItems: 210,
      pendingRentals: 45,
      platformItems: 30,
    });

    expect(prisma.endUser.count).toHaveBeenCalledTimes(1);
    expect(prisma.rental.count).toHaveBeenCalledTimes(2);
    expect(prisma.item.count).toHaveBeenCalledTimes(2);
  });

  it("should return 403 if user is not admin", async () => {
    (requireAdmin as any).mockRejectedValue(
      new Error("Forbidden – Admin access required"),
    );

    const req = new NextRequest("http://localhost:3000/api/admin", {
      method: "GET",
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
    expect(prisma.endUser.count).not.toHaveBeenCalled();
  });

  it("should return 401 if user is not authenticated", async () => {
    (requireAdmin as any).mockRejectedValue(new Error("Unauthorized"));

    const req = new NextRequest("http://localhost:3000/api/admin", {
      method: "GET",
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should handle Prisma errors gracefully", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (prisma.endUser.count as any).mockRejectedValue(
      new Error("Database error"),
    );

    const req = new NextRequest("http://localhost:3000/api/admin", {
      method: "GET",
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
