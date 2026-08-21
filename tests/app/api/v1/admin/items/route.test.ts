import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/v1/admin/items/route";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

vi.mock("@/lib/prisma", () => ({
  default: {
    item: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth-guard", () => ({
  requireAdmin: vi.fn(),
}));

describe("POST /api/admin/items – Admin Create Platform Item", () => {
  const validItemData = {
    name: "Canon EOS Camera",
    description: "Professional grade camera",
    category: "Electronics",
    pricePerDay: 250,
    deposit: 1000,
    imageUrl: "https://example.com/camera.jpg",
  };

  const createdItem = {
    id: "item-123",
    ...validItemData,
    ownerType: "PLATFORM",
    ownerId: null,
    status: "AVAILABLE",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a platform item when admin", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (prisma.item.create as any).mockResolvedValue(createdItem);

    const req = new NextRequest("http://localhost:3000/api/admin/items", {
      method: "POST",
      body: JSON.stringify(validItemData),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.item.id).toBe("item-123");
    expect(data.item.ownerType).toBe("PLATFORM");
    expect(data.item.ownerId).toBeNull();

    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        name: validItemData.name,
        description: validItemData.description,
        category: validItemData.category,
        pricePerDay: validItemData.pricePerDay,
        deposit: validItemData.deposit,
        imageUrl: validItemData.imageUrl,
        ownerType: "PLATFORM",
        ownerId: null,
        status: "AVAILABLE",
      },
    });
  });

  it("should handle missing optional fields (deposit, imageUrl)", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (prisma.item.create as any).mockResolvedValue({
      ...createdItem,
      deposit: 0,
      imageUrl: null,
    });

    const minimalData = {
      name: "Simple Item",
      description: "Simple description",
      category: "Other",
      pricePerDay: 50,
    };

    const req = new NextRequest("http://localhost:3000/api/admin/items", {
      method: "POST",
      body: JSON.stringify(minimalData),
      headers: { "Content-Type": "application/json" },
    });

    await POST(req);

    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        name: minimalData.name,
        description: minimalData.description,
        category: minimalData.category,
        pricePerDay: minimalData.pricePerDay,
        deposit: 0,
        imageUrl: undefined,
        ownerType: "PLATFORM",
        ownerId: null,
        status: "AVAILABLE",
      },
    });
  });

  it("should return 400 if validation fails", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });

    const invalidData = {
      name: "", // empty name
      pricePerDay: -10, // negative price
    };

    const req = new NextRequest("http://localhost:3000/api/admin/items", {
      method: "POST",
      body: JSON.stringify(invalidData),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it("should return 403 if not admin", async () => {
    (requireAdmin as any).mockRejectedValue(
      new Error("Forbidden – Admin access required"),
    );

    const req = new NextRequest("http://localhost:3000/api/admin/items", {
      method: "POST",
      body: JSON.stringify(validItemData),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it("should return 401 if not authenticated", async () => {
    (requireAdmin as any).mockRejectedValue(new Error("Unauthorized"));

    const req = new NextRequest("http://localhost:3000/api/admin/items", {
      method: "POST",
      body: JSON.stringify(validItemData),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
});
