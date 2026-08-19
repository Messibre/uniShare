import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { updateRentalStatusSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;

    const user = await requireAuth(req);

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 });
    }

    if (rental.deletedAt !== null) {
      return NextResponse.json(
        { error: "Rental has been deleted" },
        { status: 404 },
      );
    }

    const isOwner = rental.ownerId === user.id;
    const isRenter = rental.renterId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isRenter && !isAdmin) {
      return NextResponse.json(
        { error: "Not authorized to update this rental" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = updateRentalStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { status: newStatus, note } = parsed.data;

    if (isRenter && !isOwner && !isAdmin) {
      // Renter can only cancel
      if (newStatus !== "CANCELLED") {
        return NextResponse.json(
          { error: "Renter can only cancel the rental" },
          { status: 403 },
        );
      }

      if (!["PENDING", "CONFIRMED"].includes(rental.status)) {
        return NextResponse.json(
          { error: "Rental cannot be cancelled at this stage" },
          { status: 400 },
        );
      }
    }

    const validTransitions: Record<string, string[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["ACTIVE", "CANCELLED"],
      ACTIVE: ["RETURNED", "OVERDUE"],
      RETURNED: [],
      OVERDUE: ["RETURNED"],
      CANCELLED: [],
    };

    if (!validTransitions[rental.status]?.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status transition: ${rental.status} → ${newStatus}` },
        { status: 400 },
      );
    }

    // CONFIRMED: Check if payment is completed (we'll implement this in Phase 7)
    // For now, we allow it.

    if (newStatus === "ACTIVE" && rental.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Rental must be confirmed before becoming active" },
        { status: 400 },
      );
    }

    if (
      newStatus === "RETURNED" &&
      rental.status !== "ACTIVE" &&
      rental.status !== "OVERDUE"
    ) {
      return NextResponse.json(
        { error: "Rental must be active or overdue to be returned" },
        { status: 400 },
      );
    }

    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        status: newStatus,
        // If returning, set endDate to now (if not already set)
        ...(newStatus === "RETURNED" ? { endDate: new Date() } : {}),
      },
    });

    if (newStatus === "CONFIRMED") {
      await prisma.item.update({
        where: { id: rental.itemId },
        data: { status: "RENTED" },
      });
    }

    if (newStatus === "RETURNED" || newStatus === "CANCELLED") {
      await prisma.item.update({
        where: { id: rental.itemId },
        data: { status: "AVAILABLE" },
      });
    }

    await prisma.rentalStatusLog.create({
      data: {
        rentalId: rental.id,
        oldStatus: rental.status,
        newStatus,
        note: note || `Status changed from ${rental.status} to ${newStatus}`,
      },
    });

    return NextResponse.json(
      {
        rental: updatedRental,
        message: `Status updated to ${newStatus}`,
      },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("PATCH /api/rentals/[id]/status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
