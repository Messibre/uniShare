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
import { GET, POST } from "@/app/api/items/route";
import { makeRequest } from "@/test/helpers";

const mockedFindMany = vi.mocked(prisma.item.findMany);
const mockedCreate = vi.mocked(prisma.item.create);
const mockedRequireAuth = vi.mocked(requireAuth);

describe("GET /api/items", () => {
  it("filters to AVAILABLE items by default", async () => {
    mockedFindMany.mockResolvedValue([]);
    const req = makeRequest("/api/items");
    await GET(req);

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "AVAILABLE" }),
      }),
    );
  });

  it("applies a case-insensitive OR search across name/description", async () => {
    mockedFindMany.mockResolvedValue([]);
    const req = makeRequest("/api/items", { searchParams: { search: "bike" } });
    await GET(req);

    const call = mockedFindMany.mock.calls[0][0] as any;
    expect(call.where.OR).toEqual([
      { name: { contains: "bike", mode: "insensitive" } },
      { description: { contains: "bike", mode: "insensitive" } },
    ]);
  });

  it("applies category filter when provided", async () => {
    mockedFindMany.mockResolvedValue([]);
    const req = makeRequest("/api/items", {
      searchParams: { category: "Electronics" },
    });
    await GET(req);

    const call = mockedFindMany.mock.calls[0][0] as any;
    expect(call.where.category).toBe("Electronics");
  });

  it("applies minPrice/maxPrice range filters", async () => {
    mockedFindMany.mockResolvedValue([]);
    const req = makeRequest("/api/items", {
      searchParams: { minPrice: "10", maxPrice: "100" },
    });
    await GET(req);

    const call = mockedFindMany.mock.calls[0][0] as any;
    expect(call.where.pricePerDay).toEqual({ gte: 10, lte: 100 });
  });

  it("applies only minPrice when maxPrice is absent", async () => {
    mockedFindMany.mockResolvedValue([]);
    const req = makeRequest("/api/items", { searchParams: { minPrice: "25" } });
    await GET(req);

    const call = mockedFindMany.mock.calls[0][0] as any;
    expect(call.where.pricePerDay).toEqual({ gte: 25 });
  });

  it("returns the found items with 200", async () => {
    const items = [{ id: "i1" }, { id: "i2" }];
    mockedFindMany.mockResolvedValue(items as any);
    const res = await GET(makeRequest("/api/items"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual(items);
  });

  it("returns 500 when the database throws", async () => {
    mockedFindMany.mockRejectedValue(new Error("db down"));
    const res = await GET(makeRequest("/api/items"));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/items", () => {
  const validBody = {
    name: "Mountain Bike",
    category: "Sports",
    pricePerDay: 30,
  };

  it("returns 401 when the caller is not authenticated", async () => {
    mockedRequireAuth.mockRejectedValue(new Error("Unauthorized"));
    const req = makeRequest("/api/items", { method: "POST", body: validBody });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when the authenticated user is not ID-verified", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: false,
    } as any);
    const req = makeRequest("/api/items", { method: "POST", body: validBody });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/verify your ID/i);
  });

  it("returns 400 when the body fails schema validation", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    const req = makeRequest("/api/items", {
      method: "POST",
      body: { name: "ab", category: "", pricePerDay: -5 },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates an item owned by the authenticated user with status AVAILABLE", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    mockedCreate.mockResolvedValue({ id: "item_new", ...validBody } as any);

    const req = makeRequest("/api/items", { method: "POST", body: validBody });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockedCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: validBody.name,
        ownerType: "USER",
        ownerId: "u1",
        status: "AVAILABLE",
        deposit: 0,
      }),
    });
  });

  it("defaults deposit to 0 when omitted", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    mockedCreate.mockResolvedValue({} as any);
    const req = makeRequest("/api/items", { method: "POST", body: validBody });
    await POST(req);
    const call = mockedCreate.mock.calls[0][0] as any;
    expect(call.data.deposit).toBe(0);
  });

  it("preserves an explicit deposit value of 0 (falsy but valid)", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    mockedCreate.mockResolvedValue({} as any);
    const req = makeRequest("/api/items", {
      method: "POST",
      body: { ...validBody, deposit: 0 },
    });
    await POST(req);
    const call = mockedCreate.mock.calls[0][0] as any;
    expect(call.data.deposit).toBe(0);
  });

  it("returns 500 on unexpected database errors", async () => {
    mockedRequireAuth.mockResolvedValue({
      id: "u1",
      isIdVerified: true,
    } as any);
    mockedCreate.mockRejectedValue(new Error("db exploded"));
    const req = makeRequest("/api/items", { method: "POST", body: validBody });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
