import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/v1/admin/users/route";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";

const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      endUser: {
        findMany: vi.fn(),
        count: vi.fn(),
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

const mockedFindMany = vi.mocked(prismaMock.endUser.findMany);
const mockedCount = vi.mocked(prismaMock.endUser.count);

describe("GET /api/admin/users – List Users", () => {
  const mockUsers = [
    {
      id: "user-1",
      fullName: "Alice Student",
      email: "alice@example.com",
      role: "STUDENT",
      isIdVerified: true,
      createdAt: new Date("2026-08-01"),
      _count: { items: 3, rentalsAsRenter: 5 },
    },
    {
      id: "user-2",
      fullName: "Bob Student",
      email: "bob@example.com",
      role: "STUDENT",
      isIdVerified: false,
      createdAt: new Date("2026-08-02"),
      _count: { items: 0, rentalsAsRenter: 0 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return paginated users with default pagination", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (mockedFindMany as any).mockResolvedValue(mockUsers);
    (mockedCount as any).mockResolvedValue(2);

    const req = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "GET",
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(2);
    expect(data.users[0].fullName).toBe("Alice Student");
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("should apply search filter", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (mockedFindMany as any).mockResolvedValue([mockUsers[0]]);
    (mockedCount as any).mockResolvedValue(1);

    const req = new NextRequest(
      "http://localhost:3000/api/admin/users?search=alice",
      { method: "GET" },
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(1);
    expect(data.users[0].email).toBe("alice@example.com");

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { fullName: { contains: "alice", mode: "insensitive" } },
            { email: { contains: "alice", mode: "insensitive" } },
          ],
        },
      }),
    );
  });

  it("should filter by isVerified status", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (mockedFindMany as any).mockResolvedValue([mockUsers[1]]);
    (mockedCount as any).mockResolvedValue(1);

    const req = new NextRequest(
      "http://localhost:3000/api/admin/users?isVerified=false",
      { method: "GET" },
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users[0].isIdVerified).toBe(false);

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isIdVerified: false },
      }),
    );
  });

  it("should filter by role", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (mockedFindMany as any).mockResolvedValue([
      { ...mockUsers[0], role: "ADMIN" },
    ]);
    (mockedCount as any).mockResolvedValue(1);

    const req = new NextRequest(
      "http://localhost:3000/api/admin/users?role=ADMIN",
      { method: "GET" },
    );

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users[0].role).toBe("ADMIN");

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: "ADMIN" },
      }),
    );
  });

  it("should use custom page and limit", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (mockedFindMany as any).mockResolvedValue([]);
    (mockedCount as any).mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost:3000/api/admin/users?page=3&limit=5",
      { method: "GET" },
    );

    await GET(req);

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (3-1) * 5
        take: 5,
      }),
    );
  });

  it("should cap limit at 100", async () => {
    (requireAdmin as any).mockResolvedValue({ id: "admin-1", role: "ADMIN" });
    (mockedFindMany as any).mockResolvedValue([]);
    (mockedCount as any).mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost:3000/api/admin/users?limit=999",
      { method: "GET" },
    );

    await GET(req);

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100, // capped
      }),
    );
  });

  it("should return 403 if not admin", async () => {
    (requireAdmin as any).mockRejectedValue(
      new Error("Forbidden – Admin access required"),
    );

    const req = new NextRequest("http://localhost:3000/api/admin/users", {
      method: "GET",
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });
});
