import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

// Token expiration times
const ACCESS_EXPIRY = "15m"; // 15 minutes
const REFRESH_EXPIRY = "7d"; // 7 days

interface TokenPayload {
  userId: string;
  role: string;
}

export function signAccessToken(userId: string, role: string): string {
  const payload: TokenPayload = { userId, role };
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function signRefreshToken(userId: string, role: string): string {
  const payload: TokenPayload = { userId, role };
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
): NextResponse {
  // Access token (short-lived)
  response.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });

  // Refresh token (long-lived)
  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  return response;
}
