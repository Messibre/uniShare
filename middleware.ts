import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessTokenEdge } from "@/lib/auth-edge";

// Public routes that never need authentication
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/api/auth/(.*)", // All auth routes
  "/api/payments/webhook", // Chapa webhook
];

// Routes where GET is public, but other methods are protected
const PUBLIC_GET_ROUTES = ["/api/items"];

export const config = {
  matcher: [
    // Apply to all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;

  // 1. Allow public routes (no auth needed)
  if (PUBLIC_ROUTES.some((route) => new RegExp(`^${route}$`).test(path))) {
    return NextResponse.next();
  }

  // 2. For /api/items: allow GET, but protect POST/PATCH/DELETE
  if (
    PUBLIC_GET_ROUTES.some((route) => path.startsWith(route)) &&
    method === "GET"
  ) {
    return NextResponse.next();
  }

  // 3. All other routes require authentication
  const accessToken = request.cookies.get("accessToken")?.value;

  if (!accessToken) {
    return handleUnauthorized(request);
  }

  try {
    const payload = await verifyAccessTokenEdge(accessToken);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // Token invalid or expired
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
