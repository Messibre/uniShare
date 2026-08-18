import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma");
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, verifyAccessToken: vi.fn() };
});

import prisma from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { GET } from "@/app/api/auth/me/route";
import { makeRequest } from "@/test/helpers";

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
    const req = makeRequest("/api/auth/me", { cookies: { accessToken: "bad" } });
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid access token");
  });

  it("returns 404 when the token is valid but the user no longer exists", async () => {
    mockedVerify.mockReturnValue({ userId: "ghost", role: "STUDENT" });
    mockedFindUnique.mockResolvedValue(null);
    const req = makeRequest("/api/auth/me", { cookies: { accessToken: "good" } });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("returns the user profile on success", async () => {
    mockedVerify.mockReturnValue({ userId: dbUser.id, role: dbUser.role });
    mockedFindUnique.mockResolvedValue(dbUser as any);
    const req = makeRequest("/api/auth/me", { cookies: { accessToken: "good" } });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual(dbUser);
  });

  it("returns 500 when the database throws unexpectedly", async () => {
    mockedVerify.mockReturnValue({ userId: dbUser.id, role: dbUser.role });
    mockedFindUnique.mockRejectedValue(new Error("db down"));
    const req = makeRequest("/api/auth/me", { cookies: { accessToken: "good" } });
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
