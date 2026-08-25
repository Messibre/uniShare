import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const admin = await requireAdmin(req);

    if (admin.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 },
      );
    }

    const user = await prisma.endUser.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.deletedAt !== null) {
      return NextResponse.json(
        { error: "User already deleted" },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.endUser.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { EndUserId: id, revoked: false },
        data: { revoked: true },
      }),
    ]);

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden – Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("DELETE /admin/users/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
