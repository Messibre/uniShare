import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Now we know who the user is – create the item
    // ...
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden – Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // ... other errors
  }
}
