import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "@/test/helpers";
import prismaMock from "@/tests/lib/__mocks__/prisma";

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));
vi.mock("crypto", () => ({
  randomUUID: vi.fn(() => "abc123"),
}));
vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

import { POST as forgotPassword } from "@/app/api/v1/auth/forgot-password/route";
import { sendPasswordResetEmail } from "@/lib/email";

describe("POST /api/v1/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success even if user not found (to prevent email enumeration)", async () => {
    prismaMock.endUser.findUnique.mockResolvedValue(null);

    const req = makeRequest("/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email: "nonexistent@example.com" },
    });

    const res = await forgotPassword(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.message).toContain("If an account exists");
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("creates a reset token and sends email for existing user", async () => {
    const user = { id: "u1", email: "test@example.com", fullName: "Test User" };
    prismaMock.endUser.findUnique.mockResolvedValue(user);
    prismaMock.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.passwordResetToken.create.mockResolvedValue({
      id: "token1",
      token: "abc123",
      email: "test@example.com",
      expiresAt: new Date(),
      used: false,
    });

    const req = makeRequest("/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email: "test@example.com" },
    });

    const res = await forgotPassword(req);
    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        fullName: "Test User",
        resetLink: expect.stringContaining("/reset-password/abc123"),
      }),
    );
  });

  it("returns 400 for invalid email", async () => {
    const req = makeRequest("/api/v1/auth/forgot-password", {
      method: "POST",
      body: { email: "invalid" },
    });

    const res = await forgotPassword(req);
    expect(res.status).toBe(400);
  });
});
