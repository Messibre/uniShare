import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "@/lib/auth";

describe("signAccessToken() / verifyAccessToken()", () => {
  it("signs a token that round-trips through verification", () => {
    const token = signAccessToken("user_1", "STUDENT");
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe("user_1");
    expect(payload.role).toBe("STUDENT");
  });

  it("embeds a 15 minute expiry", () => {
    const token = signAccessToken("user_1", "STUDENT");
    const decoded = jwt.decode(token) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(15 * 60);
  });

  it("throws when verifying a token signed with a different secret", () => {
    const foreignToken = jwt.sign({ userId: "x", role: "STUDENT" }, "wrong-secret");
    expect(() => verifyAccessToken(foreignToken)).toThrow();
  });

  it("throws when verifying a malformed token string", () => {
    expect(() => verifyAccessToken("not-a-jwt")).toThrow();
  });

  it("throws when verifying an expired access token", () => {
    const expired = jwt.sign(
      { userId: "user_1", role: "STUDENT" },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: -10 },
    );
    expect(() => verifyAccessToken(expired)).toThrow(/expired/i);
  });

  it("does not verify an access token against the refresh secret", () => {
    const token = signAccessToken("user_1", "STUDENT");
    expect(() => verifyRefreshToken(token)).toThrow();
  });
});

describe("signRefreshToken() / verifyRefreshToken()", () => {
  it("signs a token that round-trips through verification", () => {
    const token = signRefreshToken("user_2", "ADMIN");
    const payload = verifyRefreshToken(token);
    expect(payload.userId).toBe("user_2");
    expect(payload.role).toBe("ADMIN");
  });

  it("embeds a 7 day expiry", () => {
    const token = signRefreshToken("user_2", "ADMIN");
    const decoded = jwt.decode(token) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
  });
});

describe("setAuthCookies()", () => {
  it("sets httpOnly accessToken and refreshToken cookies", () => {
    const response = NextResponse.json({});
    setAuthCookies(response, "access-abc", "refresh-xyz");

    const access = response.cookies.get("accessToken");
    const refresh = response.cookies.get("refreshToken");

    expect(access?.value).toBe("access-abc");
    expect(refresh?.value).toBe("refresh-xyz");
  });

  it("sets accessToken maxAge to 15 minutes and refreshToken to 7 days", () => {
    const response = NextResponse.json({});
    setAuthCookies(response, "access-abc", "refresh-xyz");

    const setCookieHeader = response.headers.getSetCookie
      ? response.headers.getSetCookie()
      : response.headers.get("set-cookie");

    expect(String(setCookieHeader)).toContain("Max-Age=900");
    expect(String(setCookieHeader)).toContain("Max-Age=604800");
  });

  it("returns the same response instance it was given", () => {
    const response = NextResponse.json({});
    const result = setAuthCookies(response, "a", "b");
    expect(result).toBe(response);
  });
});

describe("clearAuthCookies()", () => {
  it("removes accessToken and refreshToken cookies from the response", () => {
    const response = NextResponse.json({});
    setAuthCookies(response, "a", "b");
    clearAuthCookies(response);

    // After deletion, the cookie jar should no longer report these as set
    // (Next's ResponseCookies.delete adds an expiring Set-Cookie header).
    const setCookieHeader = String(
      response.headers.getSetCookie
        ? response.headers.getSetCookie()
        : response.headers.get("set-cookie"),
    );
    expect(setCookieHeader).toMatch(/accessToken=;/);
    expect(setCookieHeader).toMatch(/refreshToken=;/);
  });
});
