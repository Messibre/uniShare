import { describe, it, expect, vi, beforeEach } from "vitest";
import prismaMock from "@/tests/lib/__mocks__/prisma";

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));
vi.mock("@/lib/auth", () => ({
  verifyAccessToken: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { getCurrentUser, requireAuth, requireAdmin } from "@/lib/auth-guard";
import { makeRequest } from "@/test/helpers";

const mockedVerify = vi.mocked(verifyAccessToken);
const mockedFindUnique = vi.mocked(prisma.endUser.findUnique);

const dbUser = {
  id: "user_1",
  fullName: "Test User",
  email: "test@example.com",
  role: "STUDENT",
  isIdVerified: true,
  createdAt: new Date(),
};

describe("getCurrentUser()", () => {
  it("returns null when there is no accessToken cookie", async () => {
    const req = makeRequest("/api/whatever");
    const user = await getCurrentUser(req);
    expect(user).toBeNull();
    expect(mockedVerify).not.toHaveBeenCalled();
  });

  it("returns null when the access token fails verification", async () => {
    mockedVerify.mockImplementation(() => {
      throw new Error("invalid token");
    });
    const req = makeRequest("/api/whatever", {
      cookies: { accessToken: "bad" },
    });
    const user = await getCurrentUser(req);
    expect(user).toBeNull();
  });

  it("returns null when the token is valid but the user no longer exists", async () => {
    mockedVerify.mockReturnValue({ userId: "ghost", role: "STUDENT" });
    mockedFindUnique.mockResolvedValue(null);
    const req = makeRequest("/api/whatever", {
      cookies: { accessToken: "good" },
    });
    const user = await getCurrentUser(req);
    expect(user).toBeNull();
  });

  it("returns the user when the token is valid and the user exists", async () => {
    mockedVerify.mockReturnValue({ userId: dbUser.id, role: dbUser.role });
    mockedFindUnique.mockResolvedValue(dbUser as any);
    const req = makeRequest("/api/whatever", {
      cookies: { accessToken: "good" },
    });
    const user = await getCurrentUser(req);
    expect(user).toEqual(dbUser);
  });

  it("swallows a database error and returns null rather than throwing", async () => {
    mockedVerify.mockReturnValue({ userId: dbUser.id, role: dbUser.role });
    mockedFindUnique.mockRejectedValue(new Error("db down"));
    const req = makeRequest("/api/whatever", {
      cookies: { accessToken: "good" },
    });
    const user = await getCurrentUser(req);
    expect(user).toBeNull();
  });
});

describe("requireAuth()", () => {
  it("resolves with the user when authenticated", async () => {
    mockedVerify.mockReturnValue({ userId: dbUser.id, role: dbUser.role });
    mockedFindUnique.mockResolvedValue(dbUser as any);
    const req = makeRequest("/api/whatever", {
      cookies: { accessToken: "good" },
    });
    await expect(requireAuth(req)).resolves.toEqual(dbUser);
  });

  it("throws 'Unauthorized' when there is no valid session", async () => {
    const req = makeRequest("/api/whatever");
    await expect(requireAuth(req)).rejects.toThrow("Unauthorized");
  });
});

describe("requireAdmin()", () => {
  it("resolves with the user when the user is an ADMIN", async () => {
    const admin = { ...dbUser, role: "ADMIN" };
    mockedVerify.mockReturnValue({ userId: admin.id, role: admin.role });
    mockedFindUnique.mockResolvedValue(admin as any);
    const req = makeRequest("/api/whatever", {
      cookies: { accessToken: "good" },
    });
    await expect(requireAdmin(req)).resolves.toEqual(admin);
  });

  it("throws 'Forbidden' when the authenticated user is not an ADMIN", async () => {
    mockedVerify.mockReturnValue({ userId: dbUser.id, role: "STUDENT" });
    mockedFindUnique.mockResolvedValue(dbUser as any);
    const req = makeRequest("/api/whatever", {
      cookies: { accessToken: "good" },
    });
    await expect(requireAdmin(req)).rejects.toThrow("Forbidden");
  });

  it("throws 'Unauthorized' (not 'Forbidden') when there's no session at all", async () => {
    const req = makeRequest("/api/whatever");
    await expect(requireAdmin(req)).rejects.toThrow("Unauthorized");
  });
});
