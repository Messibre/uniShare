import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { createItemSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

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

    const item = await prisma.item.create({
      data: {
        name,
        description,
        category,
        pricePerDay,
        deposit: deposit || 0,
        imageUrl,
        ownerType: "PLATFORM",
        ownerId: null,
        status: "AVAILABLE",
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden – Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("POST /api/admin/items error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
