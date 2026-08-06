import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { createItemSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const category = url.searchParams.get("category");
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const available = url.searchParams.get("available") === "true";

    const where: any = {
      status: "AVAILABLE", // Only show available items to the public
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (minPrice || maxPrice) {
      where.pricePerDay = {};
      if (minPrice) where.pricePerDay.gte = parseFloat(minPrice);
      if (maxPrice) where.pricePerDay.lte = parseFloat(maxPrice);
    }

    if (available) {
      where.status = "AVAILABLE";
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("GET /api/items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Check authentication and get user from DB
    const user = await requireAuth(req);

    // 2. Check if user is verified
    if (!user.isIdVerified) {
      return NextResponse.json(
        { error: "Must verify your ID before listing items" },
        { status: 403 },
      );
    }

    // 3. Parse and validate request body
    const body = await req.json();
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, description, category, pricePerDay, deposit, imageUrl } =
      parsed.data;

    // 4. Create the item
    const item = await prisma.item.create({
      data: {
        name,
        description,
        category,
        pricePerDay,
        deposit: deposit || 0,
        imageUrl,
        ownerType: "USER",
        ownerId: user.id,
        status: "AVAILABLE",
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
