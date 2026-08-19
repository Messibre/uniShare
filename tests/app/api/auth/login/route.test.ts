import { describe, it, expect, vi } from "vitest";
import prismaMock from "@/tests/lib/__mocks__/prisma";

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));
vi.mock("@/lib/bcrypt", () => ({
  comparePassword: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { comparePassword } from "@/lib/bcrypt";
import { POST } from "@/app/api/auth/login/route";
import { makeRequest } from "@/test/helpers";

const mockedFindUnique = vi.mocked(prisma.endUser.findUnique);
const mockedUpdateMany = vi.mocked(prisma.refreshToken.updateMany);
const mockedCreate = vi.mocked(prisma.refreshToken.create);
const mockedCompare = vi.mocked(comparePassword);

const dbUser = {
  id: "user_1",
  fullName: "Test User",
  email: "test@example.com",
  role: "STUDENT",
  isIdVerified: true,
  passwordHash: "hashed",
};

describe("POST /api/auth/login", () => {
  it("returns 400 on a malformed body (validation failure)", async () => {
    const req = makeRequest("/api/auth/login", {
      method: "POST",
      body: { email: "not-an-email", password: "" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 401 when the user does not exist", async () => {
    mockedFindUnique.mockResolvedValue(null);
    const req = makeRequest("/api/auth/login", {
      method: "POST",
      body: { email: "nobody@example.com", password: "whatever" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("returns 401 when the password does not match", async () => {
    mockedFindUnique.mockResolvedValue(dbUser as any);
    mockedCompare.mockResolvedValue(false);
    const req = makeRequest("/api/auth/login", {
      method: "POST",
      body: { email: dbUser.email, password: "wrong" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("does not leak whether the email or password was wrong (same message both ways)", async () => {
    mockedFindUnique.mockResolvedValue(null);
    const noUserRes = await POST(
      makeRequest("/api/auth/login", {
        method: "POST",
        body: { email: "x@x.com", password: "x" },
      }),
    );

    mockedFindUnique.mockResolvedValue(dbUser as any);
    mockedCompare.mockResolvedValue(false);
    const wrongPassRes = await POST(
      makeRequest("/api/auth/login", {
        method: "POST",
        body: { email: dbUser.email, password: "wrong" },
      }),
    );

    const [a, b] = await Promise.all([noUserRes.json(), wrongPassRes.json()]);
    expect(a.error).toBe(b.error);
  });

  it("logs in successfully, revokes old tokens, and sets auth cookies", async () => {
    mockedFindUnique.mockResolvedValue(dbUser as any);
    mockedCompare.mockResolvedValue(true);
    mockedUpdateMany.mockResolvedValue({ count: 1 } as any);
    mockedCreate.mockResolvedValue({} as any);

    const req = makeRequest("/api/auth/login", {
      method: "POST",
      body: { email: dbUser.email, password: "correct" },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user).toEqual({
      id: dbUser.id,
      fullName: dbUser.fullName,
      email: dbUser.email,
      role: dbUser.role,
      isIdVerified: dbUser.isIdVerified,
    });
    expect(body.user.passwordHash).toBeUndefined();

    expect(mockedUpdateMany).toHaveBeenCalledWith({
      where: { EndUserId: dbUser.id, revoked: false },
      data: { revoked: true },
    });

    const setCookie = String(
      res.headers.getSetCookie
        ? res.headers.getSetCookie()
        : res.headers.get("set-cookie"),
    );
    expect(setCookie).toContain("accessToken=");
    expect(setCookie).toContain("refreshToken=");
  });

  it("returns 500 when req.json() throws (e.g. invalid JSON body)", async () => {
    const req = { json: () => Promise.reject(new Error("bad json")) } as any;
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("returns 500 when the database throws unexpectedly", async () => {
    mockedFindUnique.mockRejectedValue(new Error("db exploded"));
    const req = makeRequest("/api/auth/login", {
      method: "POST",
      body: { email: dbUser.email, password: "whatever" },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
