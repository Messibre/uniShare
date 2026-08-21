import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { requireAuth } from "@/lib/auth-guard";
import { updateItemSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        rentals: {
          where: {
            status: { in: ["CONFIRMED", "ACTIVE"] },
          },
          select: {
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    console.error("GET /api/items/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Check authentication
    const user = await requireAuth(req);

    // 2. Get the existing item
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { ownerId: true, ownerType: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // 3. Check ownership or admin
    const isOwner = existingItem.ownerId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Not authorized to edit this item" },
        { status: 403 },
      );
    }

    // 4. Parse and validate request body
    const body = await req.json();
    const parsed = updateItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // 5. Update the item
    const updatedItem = await prisma.item.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ item: updatedItem }, { status: 200 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/items/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Check authentication
    const user = await requireAuth(req);

    // 2. Get the existing item
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { ownerId: true, ownerType: true, status: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // 3. Check ownership or admin
    const isOwner = existingItem.ownerId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Not authorized to delete this item" },
        { status: 403 },
      );
    }

    // 4. Soft delete – set status to REMOVED
    const deletedItem = await prisma.item.update({
      where: { id },
      data: { status: "REMOVED" },
    });

    return NextResponse.json(
      { message: "Item removed successfully", item: deletedItem },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/items/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
