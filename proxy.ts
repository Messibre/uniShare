import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessTokenEdge } from "@/lib/auth-edge";
import { rateLimit } from "@/lib/rate-limit";
import { createRequestLogger } from "@/lib/logger";

const PUBLIC_ROUTES_EXACT = ["/", "/items", "/login", "/register"];

// Public API routes (with regex support)
const PUBLIC_ROUTES_REGEX = [
  "/api/v1/auth/(.*)",
  "/api/payments/webhook",
  "/api/health",
];

// Routes where GET is public, but other methods are protected (API only)
const PUBLIC_GET_ROUTES = ["/api/v1/items"];

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|opengraph-image|twitter-image|sitemap|robots).*)",
    "/api/admin/:path*",
  ],
};

/**
 * Check if a path is publicly accessible (no authentication required)
 */
function isPublicPath(path: string): boolean {
  if (PUBLIC_ROUTES_EXACT.includes(path)) {
    return true;
  }

  for (const pattern of PUBLIC_ROUTES_REGEX) {
    if (new RegExp(`^${pattern}$`).test(path)) {
      return true;
    }
  }

  if (path.startsWith("/items/")) {
    const rest = path.replace("/items/", "");
    if (rest === "create" || rest.startsWith("edit")) {
      return false;
    }
    return true;
  }

  return false;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;
  const logger = createRequestLogger(request);

  logger.info({ type: "request_start" }, `Incoming ${method} ${path}`);

  if (path.startsWith("/api/")) {
    const { success, headers } = await rateLimit(request);
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

  if (isPublicPath(path)) {
    return NextResponse.next();
  }

  if (
    PUBLIC_GET_ROUTES.some((route) => path.startsWith(route)) &&
    method === "GET"
  ) {
    return NextResponse.next();
  }

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
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
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
