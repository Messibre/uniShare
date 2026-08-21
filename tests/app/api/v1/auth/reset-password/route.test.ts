import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "@/test/helpers";
import prismaMock from "@/tests/lib/__mocks__/prisma";

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/bcrypt", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed123"),
}));

import { POST as resetPassword } from "@/app/api/v1/auth/reset-password/route";
import { hashPassword } from "@/lib/bcrypt";

describe("POST /api/v1/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if token is invalid", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);

    const req = makeRequest("/api/v1/auth/reset-password", {
      method: "POST",
      body: { token: "invalid", password: "NewPassword123!" },
    });

    const res = await resetPassword(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid or expired token");
  });

  it("returns 400 if token is used", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1",
      token: "abc",
      email: "test@example.com",
      used: true,
    });

    const req = makeRequest("/api/v1/auth/reset-password", {
      method: "POST",
      body: { token: "abc", password: "NewPassword123!" },
    });

    const res = await resetPassword(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 if token expired", async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      id: "t1",
      token: "abc",
      email: "test@example.com",
      expiresAt: new Date(Date.now() - 1000),
      used: false,
    });

    const req = makeRequest("/api/v1/auth/reset-password", {
      method: "POST",
      body: { token: "abc", password: "NewPassword123!" },
    });

    const res = await resetPassword(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("expired");
  });

  it("updates password and marks token used on success", async () => {
    const resetToken = {
      id: "t1",
      token: "abc",
      email: "test@example.com",
      expiresAt: new Date(Date.now() + 3600000),
      used: false,
    };
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(resetToken);
    prismaMock.endUser.update.mockResolvedValue({ id: "u1" });
    prismaMock.passwordResetToken.update.mockResolvedValue({});
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const req = makeRequest("/api/v1/auth/reset-password", {
      method: "POST",
      body: { token: "abc", password: "NewPassword123!" },
    });

    const res = await resetPassword(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain("Password reset successfully");

    expect(hashPassword).toHaveBeenCalledWith("NewPassword123!");
    expect(prismaMock.endUser.update).toHaveBeenCalledWith({
      where: { email: "test@example.com", deletedAt: null },
      data: { passwordHash: "hashed123" },
    });
    expect(prismaMock.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { used: true },
    });
  });
});
