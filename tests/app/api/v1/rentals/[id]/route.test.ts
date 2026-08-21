import { describe, it, expect, vi } from "vitest";
import prismaMock from "@/tests/lib/__mocks__/prisma";

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/auth-guard", () => ({
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth-guard";
import { GET, DELETE } from "@/app/api/v1/rentals/[id]/route";
import { makeRequest, ctx } from "@/tests/test/helpers";

const mockedRequireAuth = vi.mocked(requireAuth);
const mockedRequireAdmin = vi.mocked(requireAdmin);
const mockedFindUnique = vi.mocked(prisma.rental.findUnique);
const mockedRentalUpdate = vi.mocked(prisma.rental.update);
const mockedItemUpdate = vi.mocked(prisma.item.update);

const baseRental = {
  id: "rental_1",
  renterId: "renter_1",
  ownerId: "owner_1",
  status: "PENDING",
  deletedAt: null,
  itemId: "item_1",
  item: { id: "item_1" },
};

describe("GET /api/rentals/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedRequireAuth.mockRejectedValue(new Error("Unauthorized"));
    const res = await GET(
      makeRequest("/api/rentals/rental_1"),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when the rental doesn't exist", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "renter_1",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockResolvedValue(null);
    const res = await GET(
      makeRequest("/api/rentals/missing"),
      ctx({ id: "missing" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when the rental has been soft-deleted", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "renter_1",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockResolvedValue({
      ...baseRental,
      deletedAt: new Date(),
    } as any);
    const res = await GET(
      makeRequest("/api/rentals/rental_1"),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when the caller is neither renter, owner, nor admin", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "stranger",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockResolvedValue(baseRental as any);
    const res = await GET(
      makeRequest("/api/rentals/rental_1"),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(403);
  });

  it("allows the renter to view their rental", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "renter_1",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockResolvedValue(baseRental as any);
    const res = await GET(
      makeRequest("/api/rentals/rental_1"),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(200);
  });

  it("allows the owner to view the rental", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "owner_1",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockResolvedValue(baseRental as any);
    const res = await GET(
      makeRequest("/api/rentals/rental_1"),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(200);
  });

  it("allows an ADMIN to view any rental", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "admin_1",
      role: "ADMIN",
    } as any);
    mockedFindUnique.mockResolvedValue(baseRental as any);
    const res = await GET(
      makeRequest("/api/rentals/rental_1"),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(200);
  });

  it("returns 500 on unexpected database errors", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "renter_1",
      role: "STUDENT",
    } as any);
    mockedFindUnique.mockRejectedValue(new Error("db down"));
    const res = await GET(
      makeRequest("/api/rentals/rental_1"),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/rentals/[id]", () => {
  it("returns 401 for a non-admin unauthenticated caller", async () => {
    mockedRequireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const res = await DELETE(
      makeRequest("/api/rentals/rental_1", { method: "DELETE" }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is authenticated but not an admin", async () => {
    mockedRequireAdmin.mockRejectedValue(
      new Error("Forbidden – Admin access required"),
    );
    const res = await DELETE(
      makeRequest("/api/rentals/rental_1", { method: "DELETE" }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 when the rental doesn't exist", async () => {
    mockedRequireAdmin.mockResolvedValue({
      id: "admin_1",
      role: "ADMIN",
    } as any);
    mockedFindUnique.mockResolvedValue(null);
    const res = await DELETE(
      makeRequest("/api/rentals/missing", { method: "DELETE" }),
      ctx({ id: "missing" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when trying to delete an ACTIVE rental", async () => {
    mockedRequireAdmin.mockResolvedValue({
      id: "admin_1",
      role: "ADMIN",
    } as any);
    mockedFindUnique.mockResolvedValue({
      ...baseRental,
      status: "ACTIVE",
    } as any);
    const res = await DELETE(
      makeRequest("/api/rentals/rental_1", { method: "DELETE" }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(403);
  });

  it("frees the item back to AVAILABLE when deleting a CONFIRMED rental", async () => {
    mockedRequireAdmin.mockResolvedValue({
      id: "admin_1",
      role: "ADMIN",
    } as any);
    mockedFindUnique.mockResolvedValue({
      ...baseRental,
      status: "CONFIRMED",
    } as any);
    mockedItemUpdate.mockResolvedValue({} as any);
    mockedRentalUpdate.mockResolvedValue({} as any);

    const res = await DELETE(
      makeRequest("/api/rentals/rental_1", { method: "DELETE" }),
      ctx({ id: "rental_1" }),
    );

    expect(res.status).toBe(200);
    expect(mockedItemUpdate).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { status: "AVAILABLE" },
    });
  });

  it("does not touch the item when deleting a PENDING rental", async () => {
    mockedRequireAdmin.mockResolvedValue({
      id: "admin_1",
      role: "ADMIN",
    } as any);
    mockedFindUnique.mockResolvedValue({
      ...baseRental,
      status: "PENDING",
    } as any);
    mockedRentalUpdate.mockResolvedValue({} as any);

    await DELETE(
      makeRequest("/api/rentals/rental_1", { method: "DELETE" }),
      ctx({ id: "rental_1" }),
    );

    expect(mockedItemUpdate).not.toHaveBeenCalled();
  });

  it("soft-deletes by setting deletedAt", async () => {
    mockedRequireAdmin.mockResolvedValue({
      id: "admin_1",
      role: "ADMIN",
    } as any);
    mockedFindUnique.mockResolvedValue({
      ...baseRental,
      status: "PENDING",
    } as any);
    mockedRentalUpdate.mockResolvedValue({} as any);

    await DELETE(
      makeRequest("/api/rentals/rental_1", { method: "DELETE" }),
      ctx({ id: "rental_1" }),
    );

    const call = mockedRentalUpdate.mock.calls[0][0] as any;
    expect(call.where).toEqual({ id: "rental_1" });
    expect(call.data.deletedAt).toBeInstanceOf(Date);
  });

  it("returns 500 on unexpected database errors", async () => {
    mockedRequireAdmin.mockResolvedValue({
      id: "admin_1",
      role: "ADMIN",
    } as any);
    mockedFindUnique.mockRejectedValue(new Error("db down"));
    const res = await DELETE(
      makeRequest("/api/rentals/rental_1", { method: "DELETE" }),
      ctx({ id: "rental_1" }),
    );
    expect(res.status).toBe(500);
  });
});
