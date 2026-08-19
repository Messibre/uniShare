import { describe, it, expect, vi } from "vitest";
import prismaMock from "@/tests/lib/__mocks__/prisma";

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/auth-guard", () => ({
  requireAuth: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { GET, POST } from "@/app/api/rentals/route";
import { makeRequest } from "@/test/helpers";

const mockedRequireAuth = vi.mocked(requireAuth);
const mockedItemFindUnique = vi.mocked(prisma.item.findUnique);
const mockedRentalFindFirst = vi.mocked(prisma.rental.findFirst);
const mockedRentalCreate = vi.mocked(prisma.rental.create);
const mockedStatusLogCreate = vi.mocked(prisma.rentalStatusLog.create);
const mockedRentalFindMany = vi.mocked(prisma.rental.findMany);
const mockedRentalCount = vi.mocked(prisma.rental.count);

const futureStart = "2028-08-10T00:00:00.000Z";
const futureEnd = "2028-08-12T00:00:00.000Z";

const availableItem = {
  id: "item_1",
  ownerId: "owner_1",
  status: "AVAILABLE",
  pricePerDay: 50,
  deposit: 20,
  owner: { id: "owner_1" },
};

describe("POST /api/rentals", () => {
  const validBody = {
    itemId: "item_1",
    startDate: futureStart,
    endDate: futureEnd,
  };

  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockRejectedValue(new Error("Unauthorized"));
    const res = await POST(
      makeRequest("/api/rentals", { method: "POST", body: validBody }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when the user is not ID-verified", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: false,
    } as any);
    const res = await POST(
      makeRequest("/api/rentals", { method: "POST", body: validBody }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when the body fails validation", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    const res = await POST(
      makeRequest("/api/rentals", { method: "POST", body: { itemId: "" } }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when endDate is before startDate", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    const res = await POST(
      makeRequest("/api/rentals", {
        method: "POST",
        body: { itemId: "item_1", startDate: futureEnd, endDate: futureStart },
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/end date must be after start date/i);
  });

  it("returns 400 when endDate equals startDate", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    const res = await POST(
      makeRequest("/api/rentals", {
        method: "POST",
        body: {
          itemId: "item_1",
          startDate: futureStart,
          endDate: futureStart,
        },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when startDate is in the past", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    const res = await POST(
      makeRequest("/api/rentals", {
        method: "POST",
        body: { itemId: "item_1", startDate: past, endDate: futureEnd },
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/cannot be in the past/i);
  });

  it("returns 404 when the item doesn't exist", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    mockedItemFindUnique.mockResolvedValue(null);
    const res = await POST(
      makeRequest("/api/rentals", { method: "POST", body: validBody }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when the item is not AVAILABLE", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    mockedItemFindUnique.mockResolvedValue({
      ...availableItem,
      status: "RENTED",
    } as any);
    const res = await POST(
      makeRequest("/api/rentals", { method: "POST", body: validBody }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/not available/i);
  });

  it("returns 400 when the renter is also the item's owner", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      isIdVerified: true,
    } as any);
    mockedItemFindUnique.mockResolvedValue(availableItem as any);
    const res = await POST(
      makeRequest("/api/rentals", { method: "POST", body: validBody }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/cannot rent your own item/i);
  });

  it("returns 400 when the dates overlap an existing rental", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    mockedItemFindUnique.mockResolvedValue(availableItem as any);
    mockedRentalFindFirst.mockResolvedValue({ id: "existing_rental" } as any);
    const res = await POST(
      makeRequest("/api/rentals", { method: "POST", body: validBody }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/already booked/i);
  });

  it("computes totalPrice as days * pricePerDay + deposit and creates the rental as PENDING", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    mockedItemFindUnique.mockResolvedValue(availableItem as any);
    mockedRentalFindFirst.mockResolvedValue(null);
    mockedRentalCreate.mockResolvedValue({
      id: "rental_new",
      status: "PENDING",
    } as any);
    mockedStatusLogCreate.mockResolvedValue({} as any);

    const res = await POST(
      makeRequest("/api/rentals", { method: "POST", body: validBody }),
    );

    expect(res.status).toBe(201);
    const call = mockedRentalCreate.mock.calls[0][0] as any;
    // 2 days between futureStart and futureEnd => 2 * 50 + 20 = 120
    expect(call.data.totalPrice).toBe(120);
    expect(call.data.status).toBe("PENDING");
    expect(call.data.ownerId).toBe("owner_1");
  });

  it("treats a missing deposit as 0 when computing totalPrice", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    mockedItemFindUnique.mockResolvedValue({
      ...availableItem,
      deposit: null,
    } as any);
    mockedRentalFindFirst.mockResolvedValue(null);
    mockedRentalCreate.mockResolvedValue({ id: "rental_new" } as any);
    mockedStatusLogCreate.mockResolvedValue({} as any);

    await POST(
      makeRequest("/api/rentals", { method: "POST", body: validBody }),
    );

    const call = mockedRentalCreate.mock.calls[0][0] as any;
    expect(call.data.totalPrice).toBe(100); // 2 * 50 + 0
  });

  it("logs a PENDING status log entry with oldStatus null", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    mockedItemFindUnique.mockResolvedValue(availableItem as any);
    mockedRentalFindFirst.mockResolvedValue(null);
    mockedRentalCreate.mockResolvedValue({ id: "rental_new" } as any);
    mockedStatusLogCreate.mockResolvedValue({} as any);

    await POST(
      makeRequest("/api/rentals", { method: "POST", body: validBody }),
    );

    expect(mockedStatusLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        rentalId: "rental_new",
        oldStatus: null,
        newStatus: "PENDING",
      }),
    });
  });

  it("returns 500 on unexpected database errors", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    mockedItemFindUnique.mockRejectedValue(new Error("db down"));
    const res = await POST(
      makeRequest("/api/rentals", { method: "POST", body: validBody }),
    );
    expect(res.status).toBe(500);
  });
});

describe("GET /api/rentals", () => {
  it("returns 401 when the x-user-id header is missing", async () => {
    const res = await GET(makeRequest("/api/rentals"));
    expect(res.status).toBe(401);
  });

  it("returns rentals with pagination metadata", async () => {
    mockedRentalFindMany.mockResolvedValue([{ id: "r1" }] as any);
    mockedRentalCount.mockResolvedValue(1);
    const res = await GET(
      makeRequest("/api/rentals", { headers: { "x-user-id": "u1" } }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it("clamps limit to a maximum of 100", async () => {
    mockedRentalFindMany.mockResolvedValue([]);
    mockedRentalCount.mockResolvedValue(0);
    await GET(
      makeRequest("/api/rentals", {
        headers: { "x-user-id": "u1" },
        searchParams: { limit: "500" },
      }),
    );
    const call = mockedRentalFindMany.mock.calls[0][0] as any;
    expect(call.take).toBe(100);
  });

  it("floors page/limit to a minimum of 1 for invalid input", async () => {
    mockedRentalFindMany.mockResolvedValue([]);
    mockedRentalCount.mockResolvedValue(0);
    await GET(
      makeRequest("/api/rentals", {
        headers: { "x-user-id": "u1" },
        searchParams: { page: "-5", limit: "0" },
      }),
    );
    const call = mockedRentalFindMany.mock.calls[0][0] as any;
    expect(call.skip).toBe(0);
    expect(call.take).toBe(1);
  });

  it("filters by status when provided", async () => {
    mockedRentalFindMany.mockResolvedValue([]);
    mockedRentalCount.mockResolvedValue(0);
    await GET(
      makeRequest("/api/rentals", {
        headers: { "x-user-id": "u1" },
        searchParams: { status: "ACTIVE" },
      }),
    );
    const call = mockedRentalFindMany.mock.calls[0][0] as any;
    expect(call.where.status).toBe("ACTIVE");
  });

  it("always excludes soft-deleted rentals", async () => {
    mockedRentalFindMany.mockResolvedValue([]);
    mockedRentalCount.mockResolvedValue(0);
    await GET(makeRequest("/api/rentals", { headers: { "x-user-id": "u1" } }));
    const call = mockedRentalFindMany.mock.calls[0][0] as any;
    expect(call.where.deletedAt).toBeNull();
  });

  it("defaults sortOrder to desc for any value other than 'asc'", async () => {
    mockedRentalFindMany.mockResolvedValue([]);
    mockedRentalCount.mockResolvedValue(0);
    await GET(
      makeRequest("/api/rentals", {
        headers: { "x-user-id": "u1" },
        searchParams: { sortOrder: "banana" },
      }),
    );
    const call = mockedRentalFindMany.mock.calls[0][0] as any;
    expect(call.orderBy.createdAt).toBe("desc");
  });

  it("returns 500 on unexpected database errors", async () => {
    mockedRentalFindMany.mockRejectedValue(new Error("db down"));
    const res = await GET(
      makeRequest("/api/rentals", { headers: { "x-user-id": "u1" } }),
    );
    expect(res.status).toBe(500);
  });
});
