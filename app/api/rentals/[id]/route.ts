import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;

    const user = await requireAuth(req);

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        item: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        renter: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        statusLogs: {
          orderBy: { createdAt: "asc" },
        },
        payments: true,
      },
    });
    if (!rental || rental.deletedAt !== null) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 });
    }

    if (
      rental.renterId !== user.id &&
      rental.ownerId !== user.id &&
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Not authorized to view this rental" },
        { status: 403 },
      );
    }

    return NextResponse.json({ rental }, { status: 200 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/rentals/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
    const adminUser = await requireAdmin(req); // still admin-only

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!rental || rental.deletedAt !== null) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 });
    }
    if (rental.status === "ACTIVE") {
      return NextResponse.json(
        { error: "can't delete active rental" },
        { status: 403 },
      );
    }
    // If confirmed, free the item
    if (rental.status === "CONFIRMED") {
      await prisma.item.update({
        where: { id: rental.itemId },
        data: { status: "AVAILABLE" },
      });
    }

    // Soft delete – set deletedAt
    await prisma.rental.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(
      { message: "Rental soft-deleted successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden – Admin access required") {
      return NextResponse.json(
        { error: "Forbidden – Admin only" },
        { status: 403 },
      );
    }
    console.error("DELETE /api/rentals/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
