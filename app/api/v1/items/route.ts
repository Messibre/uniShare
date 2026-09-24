import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { createItemSchema } from "@/lib/validations";
import { OwnerType, ItemStatus } from "@/lib/generated/prisma";
import { getItems } from "@/lib/items";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // "mine=true" scopes the listing to the authenticated user's own items.
    // The owner id is taken from the session, never from a client-supplied
    // value, so one user cannot enumerate another user's non-public items.
    let ownerId: string | null = null;
    if (url.searchParams.get("mine") === "true") {
      const user = await requireAuth(req);
      ownerId = user.id;
    }

    const result = await getItems({
      search: url.searchParams.get("search"),
      category: url.searchParams.get("category"),
      minPrice: url.searchParams.get("minPrice"),
      maxPrice: url.searchParams.get("maxPrice"),
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      ownerId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (!user.isIdVerified) {
      return NextResponse.json(
        { error: "Must verify your ID before listing items" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      name,
      description,
      category,
      pricePerDay,
      deposit,
      imageUrl,
      ownerType,
    } = parsed.data;

    if (ownerType === "PLATFORM" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can create platform-owned items" },
        { status: 403 },
      );
    }

    const itemData = {
      name,
      description,
      category,
      pricePerDay,
      deposit: deposit || 0,
      imageUrl,
      ownerType: ownerType as OwnerType,
      ownerId: ownerType === "PLATFORM" ? null : user.id,
      status: "AVAILABLE" as ItemStatus,
    };

    const item = await prisma.item.create({
      data: itemData,
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
