import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await requireAdmin(req);

    const item = await prisma.item.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.status === "REMOVED") {
      return NextResponse.json(
        { error: "Item already removed" },
        { status: 409 },
      );
    }

    await prisma.item.update({
      where: { id },
      data: { status: "REMOVED" },
    });

    return NextResponse.json(
      { message: "Item removed successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden – Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("DELETE /admin/items/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
