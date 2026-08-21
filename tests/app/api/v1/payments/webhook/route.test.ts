import { describe, it, expect, vi } from "vitest";
import prismaMock from "@/tests/lib/__mocks__/prisma";

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));
vi.mock("@/lib/chapa", () => ({
  verifyChapaPayment: vi.fn(),
  isPaymentValid: vi.fn(),
}));
vi.mock("@/lib/payment-utils", () => ({
  handleSuccessfulPayment: vi.fn(),
}));
vi.mock("@/lib/email", () => ({
  sendPaymentConfirmationEmail: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { verifyChapaPayment, isPaymentValid } from "@/lib/chapa";
import { handleSuccessfulPayment } from "@/lib/payment-utils";
import { sendPaymentConfirmationEmail } from "@/lib/email";
import { POST } from "@/app/api/v1/payments/webhook/route";
import { makeRequest } from "@/tests/test/helpers";

const mockedPaymentFindUnique = vi.mocked(prisma.payment.findUnique);
const mockedVerify = vi.mocked(verifyChapaPayment);
const mockedIsValid = vi.mocked(isPaymentValid);
const mockedHandleSuccess = vi.mocked(handleSuccessfulPayment);
const mockedSendEmail = vi.mocked(sendPaymentConfirmationEmail);

const foundPayment = {
  id: "pay_1",
  txRef: "tx_1",
  amount: 300,
  status: "PENDING",
  rental: {
    id: "rental_1",
    item: { name: "Camera" },
    renter: { email: "a@b.com" },
  },
};

describe("POST /api/payments/webhook", () => {
  it("acknowledges (200) and ignores events that aren't charge.success / status success", async () => {
    mockedPaymentFindUnique.mockResolvedValue({
      id: "pay_1",
      status: "PENDING",
    } as any);

    const res = await POST(
      makeRequest("/api/payments/webhook", {
        method: "POST",
        body: { event: "charge.failed", status: "failed", tx_ref: "tx_1" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("returns 404 when no matching payment is found for tx_ref", async () => {
    mockedPaymentFindUnique.mockResolvedValue(null);
    const res = await POST(
      makeRequest("/api/payments/webhook", {
        method: "POST",
        body: {
          event: "charge.success",
          status: "success",
          tx_ref: "tx_missing",
        },
      }),
    );
    expect(res.status).toBe(404);
  });

  it("is idempotent: returns 200 'Already processed' without re-verifying if payment is already SUCCESS", async () => {
    mockedPaymentFindUnique.mockResolvedValue({
      ...foundPayment,
      status: "SUCCESS",
    } as any);
    const res = await POST(
      makeRequest("/api/payments/webhook", {
        method: "POST",
        body: { event: "charge.success", status: "success", tx_ref: "tx_1" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Already processed");
    expect(mockedVerify).not.toHaveBeenCalled();
  });

  it("returns 400 when Chapa verification fails (returns null)", async () => {
    mockedPaymentFindUnique.mockResolvedValue(foundPayment as any);
    mockedVerify.mockResolvedValue(null);
    const res = await POST(
      makeRequest("/api/payments/webhook", {
        method: "POST",
        body: { event: "charge.success", status: "success", tx_ref: "tx_1" },
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Verification failed");
  });

  it("returns 400 when the verified amount/currency mismatches the stored payment", async () => {
    mockedPaymentFindUnique.mockResolvedValue(foundPayment as any);
    mockedVerify.mockResolvedValue({
      status: "success",
      amount: "999.00",
      currency: "ETB",
      tx_ref: "tx_1",
    });
    mockedIsValid.mockReturnValue(false);
    const res = await POST(
      makeRequest("/api/payments/webhook", {
        method: "POST",
        body: { event: "charge.success", status: "success", tx_ref: "tx_1" },
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Verification mismatch");
  });

  it("confirms the rental and sends a confirmation email on full success", async () => {
    mockedPaymentFindUnique
      .mockResolvedValueOnce(foundPayment as any)
      .mockResolvedValueOnce({
        ...foundPayment,
        rental: {
          id: "rental_1",
          item: { name: "Camera" },
          renter: { email: "a@b.com", fullName: "Jane" },
          startDate: new Date("2026-09-01"),
          endDate: new Date("2026-09-05"),
        },
      } as any);
    mockedVerify.mockResolvedValue({
      status: "success",
      amount: "300",
      currency: "ETB",
      tx_ref: "tx_1",
    });
    mockedIsValid.mockReturnValue(true);
    mockedHandleSuccess.mockResolvedValue({} as any);

    const res = await POST(
      makeRequest("/api/payments/webhook", {
        method: "POST",
        body: {
          event: "charge.success",
          status: "success",
          tx_ref: "tx_1",
          reference: "chapa_ref_1",
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockedHandleSuccess).toHaveBeenCalledWith("tx_1", "chapa_ref_1");
    expect(mockedSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.com", itemName: "Camera" }),
    );
  });

  it("uses a fallback reference string when Chapa doesn't send one", async () => {
    mockedPaymentFindUnique
      .mockResolvedValueOnce(foundPayment as any)
      .mockResolvedValueOnce(null); // updatedPayment lookup returns null -> no email sent
    mockedVerify.mockResolvedValue({
      status: "success",
      amount: "300",
      currency: "ETB",
      tx_ref: "tx_1",
    });
    mockedIsValid.mockReturnValue(true);
    mockedHandleSuccess.mockResolvedValue({} as any);

    await POST(
      makeRequest("/api/payments/webhook", {
        method: "POST",
        body: { event: "charge.success", status: "success", tx_ref: "tx_1" },
      }),
    );

    expect(mockedHandleSuccess).toHaveBeenCalledWith("tx_1", "chapa_ref");
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it("does not send an email when the updated payment has no rental/renter", async () => {
    mockedPaymentFindUnique
      .mockResolvedValueOnce(foundPayment as any)
      .mockResolvedValueOnce({ ...foundPayment, rental: null } as any);
    mockedVerify.mockResolvedValue({
      status: "success",
      amount: "300",
      currency: "ETB",
      tx_ref: "tx_1",
    });
    mockedIsValid.mockReturnValue(true);
    mockedHandleSuccess.mockResolvedValue({} as any);

    await POST(
      makeRequest("/api/payments/webhook", {
        method: "POST",
        body: { event: "charge.success", status: "success", tx_ref: "tx_1" },
      }),
    );

    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it("still returns 200 (not 500) when an unexpected error is thrown, to avoid webhook retries", async () => {
    mockedPaymentFindUnique.mockRejectedValue(new Error("db exploded"));
    const res = await POST(
      makeRequest("/api/payments/webhook", {
        method: "POST",
        body: { event: "charge.success", status: "success", tx_ref: "tx_1" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("error");
  });

  it("returns 200 gracefully when the request body is not valid JSON", async () => {
    const req = { json: () => Promise.reject(new Error("bad json")) } as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
