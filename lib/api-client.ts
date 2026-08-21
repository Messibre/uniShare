const API_BASE = process.env.NEXT_PUBLIC_APP_BASE_URL || "";
const API_VERSION = "/api/v1";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

export async function apiClient<T = any>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, body, headers, ...rest } = options;

  const url = new URL(`${API_BASE}${API_VERSION}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  let errorData;
  try {
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText || "Unknown error" };
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      errorData.message || errorData.error || "Request failed",
      errorData,
    );
  }

  return response.json();
}
