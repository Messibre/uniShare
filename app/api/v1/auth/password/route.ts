import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-guard";
import { comparePassword, hashPassword } from "@/lib/bcrypt";
import prisma from "@/lib/prisma";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const body = await req.json();
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const dbUser = await prisma.endUser.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await comparePassword(currentPassword, dbUser.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 },
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.endUser.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    await prisma.refreshToken.updateMany({
      where: { EndUserId: user.id, revoked: false },
      data: { revoked: true },
    });

    return NextResponse.json(
      { message: "Password changed successfully. Please log in again." },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /auth/password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
