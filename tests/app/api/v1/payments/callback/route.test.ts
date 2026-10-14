import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/payment-utils", () => ({
  finalizePayment: vi.fn(),
}));

import { finalizePayment } from "@/lib/payment-utils";
import { GET } from "@/app/api/v1/payments/callback/route";
import { makeRequest } from "@/tests/test/helpers";

const mockedFinalize = vi.mocked(finalizePayment);

function location(res: Response) {
  return res.headers.get("location");
}

describe("GET /api/payments/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to the dashboard when tx_ref is missing", async () => {
    const res = await GET(makeRequest("/api/payments/callback"));
    expect(res.status).toBe(302);
    expect(location(res)).toBe("/dashboard");
    expect(mockedFinalize).not.toHaveBeenCalled();
  });

  it("redirects to the dashboard when the payment is unknown", async () => {
    mockedFinalize.mockResolvedValue({ state: "not_found" });
    const res = await GET(
      makeRequest("/api/payments/callback", {
        searchParams: { tx_ref: "tx_unknown" },
      }),
    );
    expect(location(res)).toBe("/dashboard");
  });

  it("redirects to the rental page with payment=success after a verified payment", async () => {
    mockedFinalize.mockResolvedValue({ state: "success", rentalId: "rental_1" });
    const res = await GET(
      makeRequest("/api/payments/callback", {
        searchParams: { tx_ref: "tx_1", status: "success" },
      }),
    );
    expect(mockedFinalize).toHaveBeenCalledWith("tx_1");
    expect(location(res)).toBe("/rentals/rental_1?payment=success");
  });

  it("accepts the alternative trx_ref query parameter", async () => {
    mockedFinalize.mockResolvedValue({ state: "success", rentalId: "rental_1" });
    await GET(
      makeRequest("/api/payments/callback", {
        searchParams: { trx_ref: "tx_alt" },
      }),
    );
    expect(mockedFinalize).toHaveBeenCalledWith("tx_alt");
  });

  it("reports failed when Chapa says the checkout was cancelled and nothing was paid", async () => {
    mockedFinalize.mockResolvedValue({ state: "pending", rentalId: "rental_1" });
    const res = await GET(
      makeRequest("/api/payments/callback", {
        searchParams: { tx_ref: "tx_1", status: "cancelled" },
      }),
    );
    expect(location(res)).toBe("/rentals/rental_1?payment=failed");
  });

  it("reports pending while the payment is still being confirmed", async () => {
    mockedFinalize.mockResolvedValue({ state: "pending", rentalId: "rental_1" });
    const res = await GET(
      makeRequest("/api/payments/callback", {
        searchParams: { tx_ref: "tx_1" },
      }),
    );
    expect(location(res)).toBe("/rentals/rental_1?payment=pending");
  });

  it("falls back to a pending dashboard redirect when verification throws", async () => {
    mockedFinalize.mockRejectedValue(new Error("chapa down"));
    const res = await GET(
      makeRequest("/api/payments/callback", {
        searchParams: { tx_ref: "tx_1" },
      }),
    );
    expect(location(res)).toBe("/dashboard?payment=pending");
  });
});
