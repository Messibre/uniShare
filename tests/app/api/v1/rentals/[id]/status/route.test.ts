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
import { PATCH } from "@/app/api/v1/rentals/[id]/status/route";
import { makeRequest, ctx } from "@/tests/test/helpers";

const mockedRequireAuth = vi.mocked(requireAuth);
const mockedFindUnique = vi.mocked(prisma.rental.findUnique);
const mockedRentalUpdate = vi.mocked(prisma.rental.update);
const mockedItemUpdate = vi.mocked(prisma.item.update);
const mockedStatusLogCreate = vi.mocked(prisma.rentalStatusLog.create);

function rental(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: "rental_1",
    renterId: "renter_1",
    ownerId: "owner_1",
    status: "PENDING",
    deletedAt: null,
    itemId: "item_1",
    item: { id: "item_1" },
    ...overrides,
  };
}

function setUp(rentalRecord: any) {
  mockedFindUnique.mockResolvedValue(rentalRecord);
  mockedRentalUpdate.mockResolvedValue({
    ...rentalRecord,
    status: rentalRecord.status,
  } as any);
  mockedItemUpdate.mockResolvedValue({} as any);
  mockedStatusLogCreate.mockResolvedValue({} as any);
}

describe("PATCH /api/rentals/[id]/status", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedRequireAuth.mockRejectedValue(new Error("Unauthorized"));
    const res = await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "CONFIRMED" },
      }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when the rental doesn't exist", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockResolvedValue(null);
    const res = await PATCH(
      makeRequest("/api/rentals/missing/status", {
        method: "PATCH",
        body: { status: "CONFIRMED" },
      }),
      ctx({ id: "missing" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when the rental has been soft-deleted", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockResolvedValue(
      rental({ deletedAt: new Date() }) as any,
    );
    const res = await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "CONFIRMED" },
      }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when the caller is a stranger", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "stranger",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockResolvedValue(rental() as any);
    const res = await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "CANCELLED" },
      }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when the body fails schema validation", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockResolvedValue(rental() as any);
    const res = await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "NOT_REAL" },
      }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(400);
  });

  it("restricts a pure renter to only requesting CANCELLED", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "renter_1",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockResolvedValue(rental() as any);
    const res = await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "CONFIRMED" },
      }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/can only cancel/i);
  });

  it("blocks a renter from cancelling once the rental is ACTIVE", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "renter_1",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockResolvedValue(rental({ status: "ACTIVE" }) as any);
    const res = await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "CANCELLED" },
      }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/cannot be cancelled at this stage/i);
  });

  it("allows a renter to cancel a PENDING rental", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "renter_1",
      role: "STUDENT",
    } as any);
    setUp(rental({ status: "PENDING" }));
    const res = await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "CANCELLED" },
      }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(200);
  });

  it.each([
    ["PENDING", "ACTIVE"],
    ["CONFIRMED", "RETURNED"],
    ["RETURNED", "CONFIRMED"],
    ["CANCELLED", "ACTIVE"],
    ["ACTIVE", "CONFIRMED"],
  ])("rejects the invalid transition %s -> %s", async (from, to) => {
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockResolvedValue(rental({ status: from }) as any);
    const res = await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: to },
      }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid status transition/i);
  });

  it("allows the owner to confirm a PENDING rental and marks the item RENTED", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      role: "STUDENT",
    } as any);
    setUp(rental({ status: "PENDING" }));

    const res = await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "CONFIRMED" },
      }),
      ctx({ id: "rental_1" }),
    );

    expect(res.status).toBe(200);
    expect(mockedItemUpdate).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { status: "RENTED" },
    });
  });

  it("requires CONFIRMED before allowing ACTIVE", async () => {
    // valid enum transition-wise but state guard should still block anything
    // that isn't literally CONFIRMED -> ACTIVE (covered by transitions table too)
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockResolvedValue(rental({ status: "CONFIRMED" }) as any);
    setUp(rental({ status: "CONFIRMED" }));

    const res = await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "ACTIVE" },
      }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(200);
  });

  it("allows RETURNED from ACTIVE and stamps a new endDate", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      role: "STUDENT",
    } as any);
    setUp(rental({ status: "ACTIVE" }));

    await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "RETURNED" },
      }),
      ctx({ id: "rental_1" }),
    );

    const call = mockedRentalUpdate.mock.calls[0][0] as any;
    expect(call.data.status).toBe("RETURNED");
    expect(call.data.endDate).toBeInstanceOf(Date);
  });

  it("allows RETURNED from OVERDUE as well", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      role: "STUDENT",
    } as any);
    setUp(rental({ status: "OVERDUE" }));

    const res = await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "RETURNED" },
      }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(200);
  });

  it("frees the item back to AVAILABLE on RETURNED", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      role: "STUDENT",
    } as any);
    setUp(rental({ status: "ACTIVE" }));

    await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "RETURNED" },
      }),
      ctx({ id: "rental_1" }),
    );

    expect(mockedItemUpdate).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { status: "AVAILABLE" },
    });
  });

  it("frees the item back to AVAILABLE on CANCELLED", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "renter_1",
      role: "STUDENT",
    } as any);
    setUp(rental({ status: "PENDING" }));

    await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "CANCELLED" },
      }),
      ctx({ id: "rental_1" }),
    );

    expect(mockedItemUpdate).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { status: "AVAILABLE" },
    });
  });

  it("writes a status log with the provided note", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      role: "STUDENT",
    } as any);
    setUp(rental({ status: "PENDING" }));

    await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "CONFIRMED", note: "Paid in cash" },
      }),
      ctx({ id: "rental_1" }),
    );

    expect(mockedStatusLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ note: "Paid in cash" }),
    });
  });

  it("falls back to an auto-generated note when none is provided", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      role: "STUDENT",
    } as any);
    setUp(rental({ status: "PENDING" }));

    await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "CONFIRMED" },
      }),
      ctx({ id: "rental_1" }),
    );

    const call = mockedStatusLogCreate.mock.calls[0][0] as any;
    expect(call.data.note).toMatch(/status changed from PENDING to CONFIRMED/i);
  });

  it("allows an ADMIN to perform any valid transition regardless of ownership", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "admin_1",
      role: "ADMIN",
    } as any);
    setUp(rental({ status: "PENDING" }));

    const res = await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "CANCELLED" },
      }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(200);
  });

  it("returns 500 on unexpected database errors", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockRejectedValue(new Error("db down"));
    const res = await PATCH(
      makeRequest("/api/rentals/rental_1/status", {
        method: "PATCH",
        body: { status: "CONFIRMED" },
      }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(500);
  });
});
