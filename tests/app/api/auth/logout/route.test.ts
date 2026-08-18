import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma");

import prisma from "@/lib/prisma";
import { POST } from "@/app/api/auth/logout/route";
import { makeRequest } from "@/test/helpers";

const mockedUpdateMany = vi.mocked(prisma.refreshToken.updateMany);

describe("POST /api/auth/logout", () => {
  it("revokes the refresh token when a refreshToken cookie is present", async () => {
    mockedUpdateMany.mockResolvedValue({ count: 1 } as any);
    const req = makeRequest("/api/auth/logout", {
      method: "POST",
      cookies: { refreshToken: "rt_123" },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockedUpdateMany).toHaveBeenCalledWith({
      where: { token: "rt_123", revoked: false },
      data: { revoked: true },
    });
  });

  it("succeeds even when no refreshToken cookie is present", async () => {
    const req = makeRequest("/api/auth/logout", { method: "POST" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockedUpdateMany).not.toHaveBeenCalled();
  });

  it("clears both auth cookies", async () => {
    const req = makeRequest("/api/auth/logout", { method: "POST" });
    const res = await POST(req);

    const setCookie = String(
      res.headers.getSetCookie ? res.headers.getSetCookie() : res.headers.get("set-cookie"),
    );
    expect(setCookie).toMatch(/accessToken=;/);
    expect(setCookie).toMatch(/refreshToken=;/);
  });

  it("returns 500 when revocation throws unexpectedly", async () => {
    mockedUpdateMany.mockRejectedValue(new Error("db down"));
    const req = makeRequest("/api/auth/logout", {
      method: "POST",
      cookies: { refreshToken: "rt_123" },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
