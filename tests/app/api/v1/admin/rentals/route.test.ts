import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/v1/admin/rentals/route";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

vi.mock("@/lib/prisma", () => ({
  default: {
    rental: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth-guard", () => ({
  requireAdmin: vi.fn(),
}));

describe("GET /api/admin/rentals – Admin View All Rentals", () => {
  const mockRentals = [
    {
      id: "rental-1",
      status: "PENDING",
      totalPrice: 250,
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-08-05"),
      createdAt: new Date("2026-08-01"),
      item: {
        id: "item-1",
        name: "Camera",
        owner: { id: "owner-1", fullName: "Owner 1", email: "owner@test.com" },
      },
      renter: {
        id: "renter-1",
        fullName: "Renter 1",
        email: "renter@test.com",
      },
      owner: { id: "owner-1", fullName: "Owner 1", email: "owner@test.com" },
      statusLogs: [],
      payments: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all rentals for admin with pagination", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (prisma.rental.findMany as any).mockResolvedValue(mockRentals);
    (prisma.rental.count as any).mockResolvedValue(1);

    const req = new NextRequest("http://localhost:3000/api/admin/rentals", {
      method: "GET",
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rentals).toHaveLength(1);
    expect(data.rentals[0].id).toBe("rental-1");
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });

    expect(prisma.rental.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        include: expect.objectContaining({
          item: expect.any(Object),
          renter: expect.any(Object),
          owner: expect.any(Object),
          statusLogs: expect.any(Object),
          payments: true,
        }),
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 20,
      }),
    );
  });

  it("should filter by status", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (prisma.rental.findMany as any).mockResolvedValue([]);
    (prisma.rental.count as any).mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost:3000/api/admin/rentals?status=PENDING",
      { method: "GET" },
    );

    await GET(req);

    expect(prisma.rental.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PENDING" },
      }),
    );
  });

  it("should filter by userId (renter or owner)", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (prisma.rental.findMany as any).mockResolvedValue([]);
    (prisma.rental.count as any).mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost:3000/api/admin/rentals?userId=user-123",
      { method: "GET" },
    );

    await GET(req);

    expect(prisma.rental.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ renterId: "user-123" }, { ownerId: "user-123" }],
        },
      }),
    );
  });

  it("should return 403 if not admin", async () => {
    (requireAdmin as any).mockRejectedValue(
      new Error("Forbidden – Admin access required"),
    );

    const req = new NextRequest("http://localhost:3000/api/admin/rentals", {
      method: "GET",
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });
});
