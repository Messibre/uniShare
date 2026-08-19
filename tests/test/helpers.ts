import { NextRequest } from "next/server";

interface MakeRequestOptions {
  method?: string;
  body?: unknown;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}

export function makeRequest(
  url: string,
  {
    method = "GET",
    body,
    cookies = {},
    headers = {},
    searchParams,
  }: MakeRequestOptions = {},
): NextRequest {
  const fullUrl = new URL(url, "http://localhost:3000");
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      fullUrl.searchParams.set(key, value);
    }
  }

  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  const finalHeaders: Record<string, string> = { ...headers };
  if (cookieHeader) {
    finalHeaders["cookie"] = cookieHeader;
  }
  if (body !== undefined && !finalHeaders["content-type"]) {
    finalHeaders["content-type"] = "application/json";
  }

  return new NextRequest(fullUrl, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** Wraps a plain params object the way Next's route context expects it. */
export function ctx<T extends Record<string, string>>(params: T) {
  return { params: Promise.resolve(params) };
}
