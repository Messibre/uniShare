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

  let url = `${API_VERSION}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let responseData: any;
  try {
    responseData = await response.json();
  } catch {
    responseData = { message: response.statusText || "Unknown error" };
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      responseData.message || responseData.error || "Request failed",
      responseData,
    );
  }

  return responseData;
}
