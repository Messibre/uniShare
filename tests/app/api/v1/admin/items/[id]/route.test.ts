import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAdmin } from "@/lib/auth-guard";

const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      item: {
        findUnique: vi.fn(),
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

import { DELETE } from "@/app/api/v1/admin/items/[id]/route";
import { makeRequest } from "@/tests/helpers";
import { createMockAdmin } from "@/tests/helpers/auth-mocks";

const mockedRequireAdmin = vi.mocked(requireAdmin);

describe("DELETE /api/v1/admin/items/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const adminUser = createMockAdmin({ id: "admin-1" });

  it("should return 401 if not authenticated", async () => {
    mockedRequireAdmin.mockRejectedValue(new Error("Unauthorized"));

    const req = makeRequest("/api/v1/admin/items/item-123", {
      method: "DELETE",
    });
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "item-123" }),
    });
    expect(res.status).toBe(401);
  });

  it("should return 404 if item not found", async () => {
    mockedRequireAdmin.mockResolvedValue(adminUser);
    prismaMock.item.findUnique.mockResolvedValue(null);

    const req = makeRequest("/api/v1/admin/items/missing", {
      method: "DELETE",
    });
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "missing" }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Item not found");
  });

  it("should return 409 if item already REMOVED", async () => {
    mockedRequireAdmin.mockResolvedValue(adminUser);
    prismaMock.item.findUnique.mockResolvedValue({
      id: "item-123",
      status: "REMOVED",
    });

    const req = makeRequest("/api/v1/admin/items/item-123", {
      method: "DELETE",
    });
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "item-123" }),
    });
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toBe("Item already removed");
  });

  it("should soft delete item (set status to REMOVED)", async () => {
    mockedRequireAdmin.mockResolvedValue(adminUser);
    prismaMock.item.findUnique.mockResolvedValue({
      id: "item-123",
      status: "AVAILABLE",
    });
    prismaMock.item.update.mockResolvedValue({
      id: "item-123",
      status: "REMOVED",
    });

    const req = makeRequest("/api/v1/admin/items/item-123", {
      method: "DELETE",
    });
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "item-123" }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toBe("Item removed successfully");
    expect(prismaMock.item.update).toHaveBeenCalledWith({
      where: { id: "item-123" },
      data: { status: "REMOVED" },
    });
  });
});
