import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma");
vi.mock("@/lib/auth-guard", () => ({
  requireAuth: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { GET, PATCH, DELETE } from "@/app/api/items/[id]/route";
import { makeRequest, ctx } from "@/test/helpers";

const mockedFindUnique = vi.mocked(prisma.item.findUnique);
const mockedUpdate = vi.mocked(prisma.item.update);
const mockedRequireAuth = vi.mocked(requireAuth);

describe("GET /api/items/[id]", () => {
  it("returns 404 when the item doesn't exist", async () => {
    mockedFindUnique.mockResolvedValue(null);
    const res = await GET(makeRequest("/api/items/missing"), ctx({ id: "missing" }));
    expect(res.status).toBe(404);
  });

  it("returns the item with owner/rentals included on success", async () => {
    const item = { id: "item_1", name: "Bike", owner: {}, rentals: [] };
    mockedFindUnique.mockResolvedValue(item as any);
    const res = await GET(makeRequest("/api/items/item_1"), ctx({ id: "item_1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.item).toEqual(item);
  });

  it("only includes CONFIRMED/ACTIVE rentals in the availability query", async () => {
    mockedFindUnique.mockResolvedValue({ id: "item_1" } as any);
    await GET(makeRequest("/api/items/item_1"), ctx({ id: "item_1" }));
    const call = mockedFindUnique.mock.calls[0][0] as any;
    expect(call.include.rentals.where.status.in).toEqual(["CONFIRMED", "ACTIVE"]);
  });

  it("returns 500 on unexpected database errors", async () => {
    mockedFindUnique.mockRejectedValue(new Error("db down"));
    const res = await GET(makeRequest("/api/items/item_1"), ctx({ id: "item_1" }));
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/items/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockRejectedValue(new Error("Unauthorized"));
    const res = await PATCH(
      makeRequest("/api/items/item_1", { method: "PATCH", body: { name: "New Name" } }),
      ctx({ id: "item_1" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when the item doesn't exist", async () => {
    mockedRequireAuth.mockResolvedValue({ id: "u1", role: "STUDENT" } as any);
    mockedFindUnique.mockResolvedValue(null);
    const res = await PATCH(
      makeRequest("/api/items/missing", { method: "PATCH", body: { name: "New Name" } }),
      ctx({ id: "missing" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when a non-owner, non-admin user tries to edit", async () => {
    mockedRequireAuth.mockResolvedValue({ id: "u2", role: "STUDENT" } as any);
    mockedFindUnique.mockResolvedValue({ ownerId: "u1", ownerType: "USER" } as any);
    const res = await PATCH(
      makeRequest("/api/items/item_1", { method: "PATCH", body: { name: "New Name" } }),
      ctx({ id: "item_1" }),
    );
    expect(res.status).toBe(403);
  });

  it("allows the owner to edit their own item", async () => {
    mockedRequireAuth.mockResolvedValue({ id: "u1", role: "STUDENT" } as any);
    mockedFindUnique.mockResolvedValue({ ownerId: "u1", ownerType: "USER" } as any);
    mockedUpdate.mockResolvedValue({ id: "item_1", name: "New Name" } as any);
    const res = await PATCH(
      makeRequest("/api/items/item_1", { method: "PATCH", body: { name: "New Name" } }),
      ctx({ id: "item_1" }),
    );
    expect(res.status).toBe(200);
  });

  it("allows an ADMIN to edit an item they don't own", async () => {
    mockedRequireAuth.mockResolvedValue({ id: "admin_1", role: "ADMIN" } as any);
    mockedFindUnique.mockResolvedValue({ ownerId: "someone_else", ownerType: "USER" } as any);
    mockedUpdate.mockResolvedValue({ id: "item_1" } as any);
    const res = await PATCH(
      makeRequest("/api/items/item_1", { method: "PATCH", body: { name: "New Name" } }),
      ctx({ id: "item_1" }),
    );
    expect(res.status).toBe(200);
  });

  it("returns 400 when the update body fails validation", async () => {
    mockedRequireAuth.mockResolvedValue({ id: "u1", role: "STUDENT" } as any);
    mockedFindUnique.mockResolvedValue({ ownerId: "u1", ownerType: "USER" } as any);
    const res = await PATCH(
      makeRequest("/api/items/item_1", {
        method: "PATCH",
        body: { status: "NOT_A_REAL_STATUS" },
      }),
      ctx({ id: "item_1" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 500 on unexpected database errors", async () => {
    mockedRequireAuth.mockResolvedValue({ id: "u1", role: "STUDENT" } as any);
    mockedFindUnique.mockRejectedValue(new Error("db down"));
    const res = await PATCH(
      makeRequest("/api/items/item_1", { method: "PATCH", body: { name: "New Name" } }),
      ctx({ id: "item_1" }),
    );
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/items/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockedRequireAuth.mockRejectedValue(new Error("Unauthorized"));
    const res = await DELETE(makeRequest("/api/items/item_1", { method: "DELETE" }), ctx({ id: "item_1" }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when the item doesn't exist", async () => {
    mockedRequireAuth.mockResolvedValue({ id: "u1", role: "STUDENT" } as any);
    mockedFindUnique.mockResolvedValue(null);
    const res = await DELETE(makeRequest("/api/items/missing", { method: "DELETE" }), ctx({ id: "missing" }));
    expect(res.status).toBe(404);
  });

  it("returns 403 when a non-owner, non-admin tries to delete", async () => {
    mockedRequireAuth.mockResolvedValue({ id: "u2", role: "STUDENT" } as any);
    mockedFindUnique.mockResolvedValue({ ownerId: "u1", ownerType: "USER", status: "AVAILABLE" } as any);
    const res = await DELETE(makeRequest("/api/items/item_1", { method: "DELETE" }), ctx({ id: "item_1" }));
    expect(res.status).toBe(403);
  });

  it("soft-deletes by setting status to REMOVED for the owner", async () => {
    mockedRequireAuth.mockResolvedValue({ id: "u1", role: "STUDENT" } as any);
    mockedFindUnique.mockResolvedValue({ ownerId: "u1", ownerType: "USER", status: "AVAILABLE" } as any);
    mockedUpdate.mockResolvedValue({ id: "item_1", status: "REMOVED" } as any);

    const res = await DELETE(makeRequest("/api/items/item_1", { method: "DELETE" }), ctx({ id: "item_1" }));

    expect(res.status).toBe(200);
    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { status: "REMOVED" },
    });
  });

  it("returns 500 on unexpected database errors", async () => {
    mockedRequireAuth.mockResolvedValue({ id: "u1", role: "STUDENT" } as any);
    mockedFindUnique.mockRejectedValue(new Error("db down"));
    const res = await DELETE(makeRequest("/api/items/item_1", { method: "DELETE" }), ctx({ id: "item_1" }));
    expect(res.status).toBe(500);
  });
});
