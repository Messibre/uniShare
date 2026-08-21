import { describe, it, expect, vi } from "vitest";
import prismaMock from "@/tests/lib/__mocks__/prisma";

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));
vi.mock("@/lib/auth", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, verifyRefreshToken: vi.fn() };
});

import prisma from "@/lib/prisma";
import { verifyRefreshToken } from "@/lib/auth";
import { POST } from "@/app/api/v1/auth/refresh/route";
import { makeRequest } from "@/tests/test/helpers";

const mockedVerify = vi.mocked(verifyRefreshToken);
const mockedFindUnique = vi.mocked(prisma.refreshToken.findUnique);
const mockedUpdateMany = vi.mocked(prisma.refreshToken.updateMany);
const mockedCreate = vi.mocked(prisma.refreshToken.create);

const storedToken = {
  token: "rt_123",
  EndUserId: "user_1",
  revoked: false,
  expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  EndUser: { id: "user_1", role: "STUDENT" },
};

describe("POST /api/auth/refresh", () => {
  it("returns 401 when there is no refreshToken cookie", async () => {
    const req = makeRequest("/api/auth/refresh", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when the refresh token fails JWT verification", async () => {
    mockedVerify.mockImplementation(() => {
      throw new Error("invalid");
    });
    const req = makeRequest("/api/auth/refresh", {
      method: "POST",
      cookies: { refreshToken: "bad" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid or expired refresh token");
  });

  it("returns 401 when the token isn't found in the database", async () => {
    mockedVerify.mockReturnValue({ userId: "user_1", role: "STUDENT" });
    mockedFindUnique.mockResolvedValue(null);
    const req = makeRequest("/api/auth/refresh", {
      method: "POST",
      cookies: { refreshToken: "rt_123" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Refresh token revoked");
  });

  it("returns 401 when the stored token has been revoked", async () => {
    mockedVerify.mockReturnValue({ userId: "user_1", role: "STUDENT" });
    mockedFindUnique.mockResolvedValue({
      ...storedToken,
      revoked: true,
    } as any);
    const req = makeRequest("/api/auth/refresh", {
      method: "POST",
      cookies: { refreshToken: "rt_123" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Refresh token revoked");
  });

  it("returns 401 when the stored token has expired", async () => {
    mockedVerify.mockReturnValue({ userId: "user_1", role: "STUDENT" });
    mockedFindUnique.mockResolvedValue({
      ...storedToken,
      expiresAt: new Date(Date.now() - 1000),
    } as any);
    const req = makeRequest("/api/auth/refresh", {
      method: "POST",
      cookies: { refreshToken: "rt_123" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Refresh token expired");
  });

  it("rotates the refresh token and sets new cookies on success", async () => {
    mockedVerify.mockReturnValue({ userId: "user_1", role: "STUDENT" });
    mockedFindUnique.mockResolvedValue(storedToken as any);
    mockedUpdateMany.mockResolvedValue({ count: 1 } as any);
    mockedCreate.mockResolvedValue({} as any);

    const req = makeRequest("/api/auth/refresh", {
      method: "POST",
      cookies: { refreshToken: "rt_123" },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockedUpdateMany).toHaveBeenCalledWith({
      where: { EndUserId: "user_1", revoked: false },
      data: { revoked: true },
    });
    expect(mockedCreate).toHaveBeenCalledTimes(1);

    const setCookie = String(
      res.headers.getSetCookie
        ? res.headers.getSetCookie()
        : res.headers.get("set-cookie"),
    );
    expect(setCookie).toContain("accessToken=");
    expect(setCookie).toContain("refreshToken=");
  });

  it("returns 500 on unexpected database errors", async () => {
    mockedVerify.mockReturnValue({ userId: "user_1", role: "STUDENT" });
    mockedFindUnique.mockRejectedValue(new Error("db down"));
    const req = makeRequest("/api/auth/refresh", {
      method: "POST",
      cookies: { refreshToken: "rt_123" },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
