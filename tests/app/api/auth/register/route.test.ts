import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma");
vi.mock("@/lib/bcrypt", () => ({
  hashPassword: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/bcrypt";
import { POST } from "@/app/api/auth/register/route";
import { makeRequest } from "@/test/helpers";

const mockedFindUnique = vi.mocked(prisma.endUser.findUnique);
const mockedCreate = vi.mocked(prisma.endUser.create);
const mockedTokenCreate = vi.mocked(prisma.refreshToken.create);
const mockedHash = vi.mocked(hashPassword);

const validBody = {
  fullName: "New User",
  email: "new@example.com",
  phone: "0911111111",
  password: "password1",
};

describe("POST /api/auth/register", () => {
  it("returns 400 when the body fails validation", async () => {
    const req = makeRequest("/api/auth/register", {
      method: "POST",
      body: { ...validBody, password: "short" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 when the email is already registered", async () => {
    mockedFindUnique.mockResolvedValue({ id: "existing" } as any);
    const req = makeRequest("/api/auth/register", { method: "POST", body: validBody });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Email already registered");
  });

  it("creates the user as STUDENT and unverified, hashes the password, and returns 201", async () => {
    mockedFindUnique.mockResolvedValue(null);
    mockedHash.mockResolvedValue("hashed-password");
    mockedCreate.mockResolvedValue({
      id: "new_user_1",
      fullName: validBody.fullName,
      email: validBody.email,
      phone: validBody.phone,
      role: "STUDENT",
      isIdVerified: false,
    } as any);
    mockedTokenCreate.mockResolvedValue({} as any);

    const req = makeRequest("/api/auth/register", { method: "POST", body: validBody });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockedCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: "STUDENT",
        isIdVerified: false,
        passwordHash: "hashed-password",
      }),
    });
    const body = await res.json();
    expect(body.user.role).toBe("STUDENT");
    expect(body.user.isIdVerified).toBe(false);
    expect(body.user.passwordHash).toBeUndefined();
  });

  it("sets auth cookies on successful registration", async () => {
    mockedFindUnique.mockResolvedValue(null);
    mockedHash.mockResolvedValue("hashed-password");
    mockedCreate.mockResolvedValue({
      id: "new_user_1",
      fullName: validBody.fullName,
      email: validBody.email,
      phone: validBody.phone,
      role: "STUDENT",
      isIdVerified: false,
    } as any);
    mockedTokenCreate.mockResolvedValue({} as any);

    const req = makeRequest("/api/auth/register", { method: "POST", body: validBody });
    const res = await POST(req);

    const setCookie = String(
      res.headers.getSetCookie ? res.headers.getSetCookie() : res.headers.get("set-cookie"),
    );
    expect(setCookie).toContain("accessToken=");
  });

  it("returns 500 when user creation throws unexpectedly", async () => {
    mockedFindUnique.mockResolvedValue(null);
    mockedHash.mockResolvedValue("hashed-password");
    mockedCreate.mockRejectedValue(new Error("db exploded"));

    const req = makeRequest("/api/auth/register", { method: "POST", body: validBody });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("rejects a name with only 1 character", async () => {
    const req = makeRequest("/api/auth/register", {
      method: "POST",
      body: { ...validBody, fullName: "X" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
