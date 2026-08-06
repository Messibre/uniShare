import { NextRequest, NextResponse } from "next/server";
import {
  verifyRefreshToken,
  signAccessToken,
  setAuthCookies,
  signRefreshToken,
  verifyAccessToken,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "access token not found" },
        { status: 401 },
      );
    }

    let payload;
    try {
      payload = verifyAccessToken(accessToken);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid access token" },
        { status: 401 },
      );
    }
    const id = payload.userId;
    const user = await prisma.endUser.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isIdVerified: user.isIdVerified,
        },
      },
      { status: 200 },
    );
    return response;
  } catch (err) {
    console.error("get me error", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
