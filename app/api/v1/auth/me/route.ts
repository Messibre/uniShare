import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  verifyRefreshToken,
  signAccessToken,
  setAuthCookies,
  signRefreshToken,
  verifyAccessToken,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

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
          phone: user.phone,
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

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const body = await req.json();
    const schema = z.object({
      fullName: z.string().min(2).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (parsed.data.email && parsed.data.email !== user.email) {
      const existing = await prisma.endUser.findUnique({
        where: { email: parsed.data.email },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.endUser.update({
      where: { id: user.id },
      data: parsed.data,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isIdVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Soft delete: set deletedAt
    await prisma.endUser.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    });

    await prisma.refreshToken.updateMany({
      where: { EndUserId: user.id, revoked: false },
      data: { revoked: true },
    });

    const response = NextResponse.json(
      { message: "Account deleted successfully" },
      { status: 200 },
    );
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");

    return response;
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
