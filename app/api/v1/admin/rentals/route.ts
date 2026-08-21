import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const userId = url.searchParams.get("userId");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      parseInt(url.searchParams.get("limit") || "20"),
    );
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status as any;
    if (userId) {
      where.OR = [{ renterId: userId }, { ownerId: userId }];
    }

    const [rentals, total] = await Promise.all([
      prisma.rental.findMany({
        where,
        include: {
          item: {
            include: {
              owner: { select: { id: true, fullName: true, email: true } },
            },
          },
          renter: { select: { id: true, fullName: true, email: true } },
          owner: { select: { id: true, fullName: true, email: true } },
          statusLogs: { orderBy: { createdAt: "asc" } },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.rental.count({ where }),
    ]);

    return NextResponse.json(
      {
        rentals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden – Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("GET /api/admin/rentals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
