import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { createRentalSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (!user.isIdVerified) {
      return NextResponse.json(
        { error: "Must verify your ID before renting" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = createRentalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { itemId, startDate, endDate } = parsed.data;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 },
      );
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: "Start date cannot be in the past" },
        { status: 400 },
      );
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { owner: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Item is not available for rent" },
        { status: 400 },
      );
    }

    if (item.ownerId === user.id) {
      return NextResponse.json(
        { error: "You cannot rent your own item" },
        { status: 400 },
      );
    }

    const overlappingRental = await prisma.rental.findFirst({
      where: {
        itemId: item.id,
        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
        OR: [
          {
            AND: [{ startDate: { lte: start } }, { endDate: { gte: start } }],
          },
          {
            AND: [{ startDate: { lte: end } }, { endDate: { gte: end } }],
          },
          {
            AND: [{ startDate: { gte: start } }, { endDate: { lte: end } }],
          },
        ],
      },
    });

    if (overlappingRental) {
      return NextResponse.json(
        { error: "Item is already booked for these dates" },
        { status: 400 },
      );
    }

    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalPrice = days * item.pricePerDay + (item.deposit || 0);

    const rental = await prisma.rental.create({
      data: {
        itemId: item.id,
        renterId: user.id,
        ownerId: item.ownerId!, // Should exist since ownerType = USER
        startDate: start,
        endDate: end,
        totalPrice,
        status: "PENDING",
      },
    });

    await prisma.rentalStatusLog.create({
      data: {
        rentalId: rental.id,
        oldStatus: null,
        newStatus: "PENDING",
        note: "Rental requested",
      },
    });

    return NextResponse.json(
      { rental, message: "Rental requested successfully" },
      { status: 201 },
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/rentals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rentals = await prisma.rental.findMany({
      where: {
        OR: [{ renterId: userId }, { ownerId: userId }],
      },
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
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ rentals }, { status: 200 });
  } catch (error) {
    console.error("GET /api/rentals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
