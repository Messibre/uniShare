import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessTokenEdge } from "@/lib/auth-edge";

export const config = {
  matcher: [
    // Apply to all API routes EXCEPT auth routes
    "/api/((?!auth|payments/webhook).*)",
    // Apply to all dashboard pages
    "/dashboard/:path*",
  ],
};

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;

  if (!accessToken) {
    return handleUnauthorized(request);
  }

  try {
    await verifyAccessTokenEdge(accessToken);
    return NextResponse.next();
  } catch (error) {
    return handleUnauthorized(request);
  }
}

function handleUnauthorized(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Unauthorized – please log in" },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
