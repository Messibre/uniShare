import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  initializeChapaPayment,
  verifyChapaPayment,
  isPaymentValid,
  type VerifyPaymentResponse,
} from "@/lib/chapa";

function mockFetchOnce(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const baseParams = {
  amount: 100,
  currency: "ETB",
  tx_ref: "tx_1",
  email: "a@b.com",
  first_name: "A",
  last_name: "B",
  phone_number: "0911111111",
  callback_url: "http://localhost/callback",
  return_url: "http://localhost/return",
};

describe("initializeChapaPayment()", () => {
  it("returns the checkout_url and tx_ref on success", async () => {
    mockFetchOnce({
      status: "success",
      data: { checkout_url: "https://checkout.chapa.co/xyz", tx_ref: "tx_1" },
    });

    const result = await initializeChapaPayment(baseParams);
    expect(result).toEqual({
      checkout_url: "https://checkout.chapa.co/xyz",
      tx_ref: "tx_1",
    });
  });

  it("sends amount as a string in the request body", async () => {
    const fetchMock = mockFetchOnce({
      status: "success",
      data: { checkout_url: "https://checkout.chapa.co/xyz", tx_ref: "tx_1" },
    });

    await initializeChapaPayment(baseParams);

    const [, options] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody.amount).toBe("100");
  });

  it("falls back to default customization when none is provided", async () => {
    const fetchMock = mockFetchOnce({
      status: "success",
      data: { checkout_url: "https://checkout.chapa.co/xyz", tx_ref: "tx_1" },
    });

    await initializeChapaPayment(baseParams);

    const [, options] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody.customization).toEqual({
      title: "UniShare",
      description: "campus rental payment",
    });
  });

  it("uses custom customization/meta when provided", async () => {
    const fetchMock = mockFetchOnce({
      status: "success",
      data: { checkout_url: "https://checkout.chapa.co/xyz", tx_ref: "tx_1" },
    });

    await initializeChapaPayment({
      ...baseParams,
      customization: { title: "Custom", description: "Custom desc" },
      meta: { rental_id: "r1" },
    });

    const [, options] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody.customization).toEqual({ title: "Custom", description: "Custom desc" });
    expect(sentBody.meta).toEqual({ rental_id: "r1" });
  });

  it("throws with Chapa's error message when status is not 'success'", async () => {
    mockFetchOnce({ status: "failed", message: "Invalid amount" });
    await expect(initializeChapaPayment(baseParams)).rejects.toThrow("Invalid amount");
  });

  it("throws a generic error when Chapa fails without a message", async () => {
    mockFetchOnce({ status: "failed" });
    await expect(initializeChapaPayment(baseParams)).rejects.toThrow(
      "Failed to initialize payment",
    );
  });
});

describe("verifyChapaPayment()", () => {
  it("returns the parsed verification data on success", async () => {
    mockFetchOnce({
      status: "success",
      data: {
        status: "success",
        amount: "100.00",
        currency: "ETB",
        tx_ref: "tx_1",
        payment_method: "telebirr",
      },
    });

    const result = await verifyChapaPayment("tx_1");
    expect(result).toEqual({
      status: "success",
      amount: "100.00",
      currency: "ETB",
      tx_ref: "tx_1",
      payment_method: "telebirr",
    });
  });

  it("returns null when Chapa reports a non-success status", async () => {
    mockFetchOnce({ status: "failed" });
    const result = await verifyChapaPayment("tx_1");
    expect(result).toBeNull();
  });

  it("returns null (not throw) when fetch itself rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const result = await verifyChapaPayment("tx_1");
    expect(result).toBeNull();
  });

  it("returns null when the response body is not valid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("bad json")),
      }),
    );
    const result = await verifyChapaPayment("tx_1");
    expect(result).toBeNull();
  });
});

describe("isPaymentValid()", () => {
  const successVerification: VerifyPaymentResponse = {
    status: "success",
    amount: "100.00",
    currency: "ETB",
    tx_ref: "tx_1",
  };

  it("returns true when status/amount/currency all match", () => {
    expect(isPaymentValid(successVerification, 100)).toBe(true);
  });

  it("returns false when verification status is not 'success'", () => {
    expect(
      isPaymentValid({ ...successVerification, status: "failed" }, 100),
    ).toBe(false);
  });

  it("returns false when the amount does not match", () => {
    expect(isPaymentValid(successVerification, 99.99)).toBe(false);
  });

  it("returns false when the currency does not match the default 'ETB'", () => {
    expect(
      isPaymentValid({ ...successVerification, currency: "USD" }, 100),
    ).toBe(false);
  });

  it("respects a custom expectedCurrency argument", () => {
    expect(
      isPaymentValid({ ...successVerification, currency: "USD" }, 100, "USD"),
    ).toBe(true);
  });

  it("treats amount as a float, so '100.00' matches 100", () => {
    expect(isPaymentValid({ ...successVerification, amount: "100.00" }, 100)).toBe(
      true,
    );
  });

  it("returns false for a non-numeric amount string", () => {
    expect(
      isPaymentValid({ ...successVerification, amount: "not-a-number" }, 100),
    ).toBe(false);
  });
});
