import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          token: refreshToken,
          revoked: false,
        },
        data: { revoked: true },
      });
    }

    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 },
    );

    return clearAuthCookies(response);
  } catch (error) {
    logger.error({ err: error }, "Logout error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
