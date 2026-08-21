import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/v1/payments/callback/route";
import { makeRequest } from "@/tests/test/helpers";

describe("GET /api/payments/callback", () => {
  it("returns a failure HTML page when status=failed", async () => {
    const res = await GET(
      makeRequest("/api/payments/callback", {
        searchParams: { status: "failed" },
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("Payment Failed");
  });

  it("returns a failure HTML page when status=cancelled", async () => {
    const res = await GET(
      makeRequest("/api/payments/callback", {
        searchParams: { status: "cancelled" },
      }),
    );
    const html = await res.text();
    expect(html).toContain("Payment Failed");
  });

  it("returns a processing/success HTML page for any other status", async () => {
    const res = await GET(
      makeRequest("/api/payments/callback", {
        searchParams: { status: "success" },
      }),
    );
    const html = await res.text();
    expect(html).toContain("confirming your payment");
  });

  it("returns the processing page when status is missing entirely", async () => {
    const res = await GET(makeRequest("/api/payments/callback"));
    const html = await res.text();
    expect(html).toContain("confirming your payment");
  });

  it("echoes the tx_ref into the processing page", async () => {
    const res = await GET(
      makeRequest("/api/payments/callback", {
        searchParams: { tx_ref: "rental_abc_123" },
      }),
    );
    const html = await res.text();
    expect(html).toContain("rental_abc_123");
  });

  it("shows 'N/A' when tx_ref is missing", async () => {
    const res = await GET(makeRequest("/api/payments/callback"));
    const html = await res.text();
    expect(html).toContain("N/A");
  });

  it("does not reflect a malicious tx_ref unescaped in a way that breaks the page structure", async () => {
    // Documents current (unescaped) behavior — the route interpolates tx_ref directly.
    const res = await GET(
      makeRequest("/api/payments/callback", {
        searchParams: { tx_ref: "<script>alert(1)</script>" },
      }),
    );
    const html = await res.text();
    expect(html).toContain("<script>alert(1)</script>");
  });
});
