import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function getCurrentUser(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const payload = verifyAccessToken(accessToken);
    const user = await prisma.endUser.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        phone: true,
        isIdVerified: true,
        createdAt: true,
      },
    });
    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin(req: NextRequest) {
  const user = await requireAuth(req);
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden – Admin access required");
  }
  return user;
}
