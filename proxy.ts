import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessTokenEdge } from "@/lib/auth-edge";
import { rateLimit } from "@/lib/rate-limit";
import { createRequestLogger } from "@/lib/logger";
import { ipAddress } from "@vercel/functions";

// Public routes
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/api/v1/auth/(.*)",
  "/api/payments/webhook",
  "/api/health",
];
const PUBLIC_GET_ROUTES = ["/api/v1/items"];

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/api/admin/:path*",
  ],
};

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;
  const logger = createRequestLogger(request);

  const ip = ipAddress(request) || "anonymous";

  // ---- 1. LOGGING ----
  logger.info({ type: "request_start" }, `Incoming ${method} ${path}`);

  // ---- 2. RATE LIMITING ----
  // Apply rate limiting only to API routes
  if (path.startsWith("/api/")) {
    const { success, limit, remaining, reset, headers } =
      await rateLimit(request);

    // If rate limit exceeded, return 429
    if (!success) {
      logger.warn(
        { type: "rate_limit_exceeded" },
        `Rate limit exceeded for ${path}`,
      );
      return NextResponse.json(
        { error: "Too many requests, please try again later." },
        { status: 429, headers },
      );
    }
  }

  // ---- 3. AUTH CHECKS ----
  // Public routes
  if (PUBLIC_ROUTES.some((route) => new RegExp(`^${route}$`).test(path))) {
    return NextResponse.next();
  }

  // GET /api/v1/items is public
  if (
    PUBLIC_GET_ROUTES.some((route) => path.startsWith(route)) &&
    method === "GET"
  ) {
    return NextResponse.next();
  }

  // Authenticated routes
  const accessToken = request.cookies.get("accessToken")?.value;
  if (!accessToken) {
    logger.warn({ type: "auth_failed" }, `Missing token for ${path}`);
    return handleUnauthorized(request);
  }

  try {
    const payload = await verifyAccessTokenEdge(accessToken);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-role", payload.role);

    logger.info(
      { type: "auth_success", userId: payload.userId },
      `Authenticated ${path}`,
    );
    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (error) {
    logger.error(
      { type: "auth_error", error: String(error) },
      `Auth failed for ${path}`,
    );
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
