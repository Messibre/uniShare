import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [
      totalUsers,
      totalRentals,
      totalItems,
      pendingRentals,
      platformItems,
    ] = await Promise.all([
      prisma.endUser.count(),
      prisma.rental.count(),
      prisma.item.count(),
      prisma.rental.count({ where: { status: "PENDING" } }),
      prisma.item.count({ where: { ownerType: "PLATFORM" } }),
    ]);

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          totalRentals,
          totalItems,
          pendingRentals,
          platformItems,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden – Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
