import { describe, it, expect } from "vitest";
import { SignJWT } from "jose";
import { verifyAccessTokenEdge, verifyRefreshTokenEdge } from "@/lib/auth-edge";

const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

async function signWith(secret: Uint8Array, payload: object, expiresIn = "15m") {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

describe("verifyAccessTokenEdge()", () => {
  it("verifies a valid access token and returns userId/role", async () => {
    const token = await signWith(accessSecret, { userId: "u1", role: "STUDENT" });
    const payload = await verifyAccessTokenEdge(token);
    expect(payload).toEqual({ userId: "u1", role: "STUDENT" });
  });

  it("rejects a token signed with the wrong secret", async () => {
    const token = await signWith(refreshSecret, { userId: "u1", role: "STUDENT" });
    await expect(verifyAccessTokenEdge(token)).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    const token = await signWith(accessSecret, { userId: "u1", role: "STUDENT" }, "-1s");
    await expect(verifyAccessTokenEdge(token)).rejects.toThrow();
  });

  it("rejects a malformed token string", async () => {
    await expect(verifyAccessTokenEdge("garbage")).rejects.toThrow();
  });
});

describe("verifyRefreshTokenEdge()", () => {
  it("verifies a valid refresh token and returns userId/role", async () => {
    const token = await signWith(refreshSecret, { userId: "u2", role: "ADMIN" }, "7d");
    const payload = await verifyRefreshTokenEdge(token);
    expect(payload).toEqual({ userId: "u2", role: "ADMIN" });
  });

  it("does not accept an access-secret-signed token", async () => {
    const token = await signWith(accessSecret, { userId: "u2", role: "ADMIN" });
    await expect(verifyRefreshTokenEdge(token)).rejects.toThrow();
  });
});
