import { NextRequest } from "next/server";

interface MakeRequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}

export function makeRequest(
  path: string,
  options: MakeRequestOptions = {},
): NextRequest {
  const url = new URL(`http://localhost:3000${path}`);
  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  return new NextRequest(url.toString(), {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  }) as NextRequest;
}
