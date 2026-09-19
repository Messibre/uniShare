import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiError } from "@/lib/api-client";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Helper to build a mock Response
function mockResponse({
  ok = true,
  status = 200,
  statusText = "OK",
  json = {},
}: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  json?: any;
}) {
  return {
    ok,
    status,
    statusText,
    json: vi.fn().mockResolvedValue(json),
  };
}

describe("apiClient", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("URL construction", () => {
    it("prefixes paths with /api/v1", async () => {
      mockFetch.mockResolvedValue(mockResponse({ json: { ok: true } }));

      await apiClient("/auth/login");

      const [url, options] = mockFetch.mock.calls[0];

      expect(new URL(url as string).pathname).toBe("/api/v1/auth/login");
      expect(options).toEqual(
        expect.objectContaining({ credentials: "include" }),
      );
    });

    it("serializes query params into the URL", async () => {
      mockFetch.mockResolvedValue(mockResponse({ json: { ok: true } }));

      await apiClient("/items", {
        params: { search: "camera", page: 2, available: true },
      });

      const url = mockFetch.mock.calls[0][0] as string;
      const parsed = new URL(url);

      expect(parsed.searchParams.get("search")).toBe("camera");
      expect(parsed.searchParams.get("page")).toBe("2");
      expect(parsed.searchParams.get("available")).toBe("true");
    });

    it("skips undefined and null query params", async () => {
      mockFetch.mockResolvedValue(mockResponse({ json: { ok: true } }));

      await apiClient("/items", {
        params: { search: "camera", category: undefined, minPrice: "" },
      });

      const url = mockFetch.mock.calls[0][0] as string;
      const parsed = new URL(url);

      expect(parsed.searchParams.get("search")).toBe("camera");
      expect(parsed.searchParams.has("category")).toBe(false);
      expect(parsed.searchParams.has("minPrice")).toBe(false);
    });

    it("does not append '?' when no params are given", async () => {
      mockFetch.mockResolvedValue(mockResponse({ json: { ok: true } }));

      await apiClient("/auth/me");

      const url = mockFetch.mock.calls[0][0] as string;
      const parsed = new URL(url);

      expect(parsed.pathname).toBe("/api/v1/auth/me");
      expect(parsed.search).toBe("");
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Request options
  // ────────────────────────────────────────────────────────────
  describe("Request options", () => {
    it("sets credentials: include on every request", async () => {
      mockFetch.mockResolvedValue(mockResponse({ json: {} }));

      await apiClient("/auth/me");

      const options = mockFetch.mock.calls[0][1];
      expect(options.credentials).toBe("include");
    });

    it("sets Content-Type: application/json by default", async () => {
      mockFetch.mockResolvedValue(mockResponse({ json: {} }));

      await apiClient("/auth/me");

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers["Content-Type"]).toBe("application/json");
    });

    it("allows custom headers to override defaults", async () => {
      mockFetch.mockResolvedValue(mockResponse({ json: {} }));

      await apiClient("/auth/me", {
        headers: { "X-Custom": "value" },
      });

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers["X-Custom"]).toBe("value");
      expect(options.headers["Content-Type"]).toBe("application/json");
    });

    it("serializes body to JSON", async () => {
      mockFetch.mockResolvedValue(mockResponse({ json: {} }));

      await apiClient("/auth/login", {
        method: "POST",
        body: { email: "test@test.com", password: "pass123" },
      });

      const options = mockFetch.mock.calls[0][1];
      expect(options.body).toBe(
        JSON.stringify({ email: "test@test.com", password: "pass123" }),
      );
    });

    it("omits body when none is provided", async () => {
      mockFetch.mockResolvedValue(mockResponse({ json: {} }));

      await apiClient("/auth/me");

      const options = mockFetch.mock.calls[0][1];
      expect(options.body).toBeUndefined();
    });

    it("forwards the HTTP method", async () => {
      mockFetch.mockResolvedValue(mockResponse({ json: {} }));

      await apiClient("/items/123", { method: "DELETE" });

      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe("DELETE");
    });
  });

  describe("Success responses", () => {
    it("returns parsed JSON on 200", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ json: { user: { id: "1", name: "Test" } } }),
      );

      const result = await apiClient<{ user: { id: string } }>("/auth/me");

      expect(result).toEqual({ user: { id: "1", name: "Test" } });
    });

    it("returns parsed JSON on 201", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          status: 201,
          statusText: "Created",
          json: { item: {} },
        }),
      );

      const result = await apiClient("/items", { method: "POST", body: {} });

      expect(result).toEqual({ item: {} });
    });

    it("parses the response body only once", async () => {
      const jsonMock = vi.fn().mockResolvedValue({ user: {} });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: jsonMock,
      });

      await apiClient("/auth/me");

      expect(jsonMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error responses", () => {
    it("throws ApiError with status and message on 400", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          json: { error: "Validation failed" },
        }),
      );

      await expect(apiClient("/auth/register")).rejects.toThrow(ApiError);

      try {
        await apiClient("/auth/register");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(400);
        expect((err as ApiError).message).toBe("Validation failed");
        expect((err as ApiError).data).toEqual({ error: "Validation failed" });
      }
    });

    it("throws ApiError on 401 Unauthorized", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          json: { message: "Invalid email or password" },
        }),
      );

      await expect(apiClient("/auth/login")).rejects.toThrow(
        "Invalid email or password",
      );
    });

    it("throws ApiError on 403 Forbidden", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          json: { error: "Forbidden – Admin access required" },
        }),
      );

      await expect(apiClient("/admin/users")).rejects.toThrow(
        "Forbidden – Admin access required",
      );
    });

    it("throws ApiError on 404 Not Found", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: { error: "Item not found" },
        }),
      );

      await expect(apiClient("/items/missing")).rejects.toThrow(
        "Item not found",
      );
    });

    it("throws ApiError on 500 Internal Server Error", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: { error: "Internal server error" },
        }),
      );

      await expect(apiClient("/items")).rejects.toThrow(
        "Internal server error",
      );
    });

    it("prefers `message` field over `error` field", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 400,
          json: { message: "Primary message", error: "Secondary" },
        }),
      );

      await expect(apiClient("/test")).rejects.toThrow("Primary message");
    });

    it("falls back to `error` field when `message` is missing", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 400,
          json: { error: "Error field message" },
        }),
      );

      await expect(apiClient("/test")).rejects.toThrow("Error field message");
    });

    it("falls back to 'Request failed' when both fields are missing", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          ok: false,
          status: 500,
          json: {},
        }),
      );

      await expect(apiClient("/test")).rejects.toThrow("Request failed");
    });

    it("falls back to statusText when JSON parsing fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      await expect(apiClient("/test")).rejects.toThrow("Bad Gateway");
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Edge cases
  // ────────────────────────────────────────────────────────────
  describe("Edge cases", () => {
    it("handles empty response body gracefully", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockRejectedValue(new Error("No body")),
      });

      const result = await apiClient("/auth/logout", { method: "POST" });

      expect(result).toEqual({});
    });

    it("handles boolean query params correctly", async () => {
      mockFetch.mockResolvedValue(mockResponse({ json: {} }));

      await apiClient("/items", { params: { available: false } });
      const url = mockFetch.mock.calls[0][0] as string;
      const parsed = new URL(url);

      expect(parsed.searchParams.get("available")).toBe("false");
    });

    it("handles number query params correctly", async () => {
      mockFetch.mockResolvedValue(mockResponse({ json: {} }));

      await apiClient("/items", { params: { minPrice: 0 } });
      const url = mockFetch.mock.calls[0][0] as string;
      const parsed = new URL(url);

      expect(parsed.searchParams.get("minPrice")).toBe("0");
    });
  });
});
