// In the browser, always target the same origin the app is served from so
// client requests can't break when NEXT_PUBLIC_APP_BASE_URL is baked to a
// different domain than the one the user is actually on. Only fall back to the
// configured base URL on the server, where there is no window.origin.
const API_BASE =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";
const API_VERSION = "/api/v1";

import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean | undefined>;
  /** Internal: set on the single retry made after a silent token refresh. */
  _retry?: boolean;
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

function buildApiUrl(path: string, params?: FetchOptions["params"]) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_VERSION}${normalizedPath}`, API_BASE);

  if (params) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });

    if (searchParams.size > 0) {
      url.search = searchParams.toString();
    }
  }

  return url.toString();
}

// Share one in-flight refresh so parallel 401s don't each rotate the token.
let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(buildApiUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function handleSessionExpired() {
  if (typeof window === "undefined") return;

  const store = useAuthStore.getState();
  if (!store.isAuthenticated) return;

  store.logout();
  toast.error("Your session has expired. Please sign in again.");
  const here = window.location.pathname + window.location.search;
  window.location.assign(
    `/login?expired=1&redirect=${encodeURIComponent(here)}`,
  );
}

export async function apiClient<T = any>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, body, headers, _retry, ...rest } = options;

  const url = buildApiUrl(path, params);

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
    responseData = response.ok
      ? {}
      : { message: response.statusText || "Unknown error" };
  }

  // Auth endpoints report their own 401s (bad credentials, no session yet).
  if (
    response.status === 401 &&
    typeof window !== "undefined" &&
    !path.startsWith("/auth/")
  ) {
    if (!_retry && (await refreshSession())) {
      return apiClient<T>(path, { ...options, _retry: true });
    }
    handleSessionExpired();
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
