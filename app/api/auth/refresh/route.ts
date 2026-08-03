import { NextRequest, NextResponse } from "next/server";
import {
  verifyRefreshToken,
  signAccessToken,
  setAuthCookies,
  signRefreshToken,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token not found" },
        { status: 401 },
      );
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 },
      );
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { EndUser: true },
    });

    if (!storedToken || storedToken.revoked) {
      return NextResponse.json(
        { error: "Refresh token revoked" },
        { status: 401 },
      );
    }

    if (new Date() > storedToken.expiresAt) {
      return NextResponse.json(
        { error: "Refresh token expired" },
        { status: 401 },
      );
    }

    const newAccessToken = signAccessToken(
      storedToken.EndUser.id,
      storedToken.EndUser.role,
    );

    const newRefreshToken = signRefreshToken(
      storedToken.EndUser.id,
      storedToken.EndUser.role,
    );

    await prisma.refreshToken.updateMany({
      where: {
        EndUserId: storedToken.EndUser.id,
        revoked: false,
      },
      data: { revoked: true },
    });

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        EndUserId: storedToken.EndUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Access token refreshed",
      },
      { status: 200 },
    );
    return setAuthCookies(response, newAccessToken, newRefreshToken);
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
