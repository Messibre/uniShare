import { describe, it, expect, vi } from "vitest";
import prismaMock from "@/tests/lib/__mocks__/prisma";

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/auth-guard", () => ({
  requireAuth: vi.fn(),
}));
vi.mock("@/lib/auth", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, verifyAccessToken: vi.fn() };
});

import prisma from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-guard";
import { GET, PATCH, DELETE } from "@/app/api/v1/auth/me/route";
import { makeRequest } from "@/tests/test/helpers";

const mockedVerify = vi.mocked(verifyAccessToken);
const mockedFindUnique = vi.mocked(prisma.endUser.findUnique);

const dbUser = {
  id: "user_1",
  fullName: "Test User",
  email: "test@example.com",
  phone: "0911111111",
  role: "STUDENT",
  isIdVerified: true,
};

describe("GET /api/auth/me", () => {
  it("returns 401 when no accessToken cookie is present", async () => {
    const req = makeRequest("/api/auth/me");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when the access token is invalid", async () => {
    mockedVerify.mockImplementation(() => {
      throw new Error("bad token");
    });
    const req = makeRequest("/api/auth/me", {
      cookies: { accessToken: "bad" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid access token");
  });

  it("returns 404 when the token is valid but the user no longer exists", async () => {
    mockedVerify.mockReturnValue({ userId: "ghost", role: "STUDENT" });
    mockedFindUnique.mockResolvedValue(null);
    const req = makeRequest("/api/auth/me", {
      cookies: { accessToken: "good" },
    });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("returns the user profile on success", async () => {
    mockedVerify.mockReturnValue({ userId: dbUser.id, role: dbUser.role });
    mockedFindUnique.mockResolvedValue(dbUser as any);
    const req = makeRequest("/api/auth/me", {
      cookies: { accessToken: "good" },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual(dbUser);
  });

  it("returns 500 when the database throws unexpectedly", async () => {
    mockedVerify.mockReturnValue({ userId: dbUser.id, role: dbUser.role });
    mockedFindUnique.mockRejectedValue(new Error("db down"));
    const req = makeRequest("/api/auth/me", {
      cookies: { accessToken: "good" },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/auth/me", () => {
  const mockUser = {
    id: "u1",
    fullName: "Old Name",
    email: "old@example.com",
    phone: "+251900000000",
    role: "STUDENT",
    isIdVerified: true,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates user profile successfully", async () => {
    (requireAuth as any).mockResolvedValue(mockUser);
    prismaMock.endUser.findUnique.mockResolvedValue(null); // no email conflict
    prismaMock.endUser.update.mockResolvedValue({
      ...mockUser,
      fullName: "New Name",
    });

    const req = makeRequest("/api/auth/me", {
      method: "PATCH",
      body: { fullName: "New Name" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.fullName).toBe("New Name");
    expect(prismaMock.endUser.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { fullName: "New Name" },
      select: expect.any(Object),
    });
  });

  it("returns 409 if email is taken", async () => {
    (requireAuth as any).mockResolvedValue(mockUser);
    prismaMock.endUser.findUnique.mockResolvedValue({
      id: "other",
      email: "taken@example.com",
    });

    const req = makeRequest("/api/auth/me", {
      method: "PATCH",
      body: { email: "taken@example.com" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("Email already in use");
  });

  it("returns 401 if not authenticated", async () => {
    (requireAuth as any).mockRejectedValue(new Error("Unauthorized"));

    const req = makeRequest("/api/auth/me", {
      method: "PATCH",
      body: { fullName: "New Name" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/auth/me", () => {
  const mockUser = { id: "u1", email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("soft deletes account and revokes tokens", async () => {
    (requireAuth as any).mockResolvedValue(mockUser);
    prismaMock.endUser.update.mockResolvedValue({});
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const req = makeRequest("/api/auth/me", { method: "DELETE" });

    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain("deleted");

    expect(prismaMock.endUser.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { EndUserId: "u1", revoked: false },
      data: { revoked: true },
    });
  });

  it("returns 401 if not authenticated", async () => {
    (requireAuth as any).mockRejectedValue(new Error("Unauthorized"));

    const req = makeRequest("/api/auth/me", { method: "DELETE" });

    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });
});
