import { describe, it, expect, vi, beforeEach } from "vitest";

import prismaMock from "./__mocks__/prisma";

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

const sendMock = vi.fn().mockResolvedValue({ id: "email_1" });
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const mockedRentalFindUnique = vi.mocked(prismaMock.rental.findUnique);
const mockedRentalUpdate = vi.mocked(prismaMock.rental.update);
const mockedItemUpdate = vi.mocked(prismaMock.item.update);
const mockedStatusLogCreate = vi.mocked(prismaMock.rentalStatusLog.create);
const mockedPaymentFindUnique = vi.mocked(prismaMock.payment.findUnique);
const mockedPaymentUpdateMany = vi.mocked(prismaMock.payment.updateMany);
const mockedTransaction = vi.mocked(prismaMock.$transaction);

import {
  confirmRentalAfterPayment,
  handleSuccessfulPayment,
  markPaymentSuccessful,
} from "@/lib/payment-utils";

beforeEach(() => {
  vi.clearAllMocks();
  mockedTransaction.mockImplementation(async (fn: any) => fn(prismaMock));
});

describe("confirmRentalAfterPayment()", () => {
  it("updates a PENDING rental to CONFIRMED, marks the item RENTED, and logs the transition", async () => {
    mockedRentalFindUnique.mockResolvedValue({
      id: "rental_1",
      itemId: "item_1",
      status: "PENDING",
    } as any);
    mockedRentalUpdate.mockResolvedValue({
      id: "rental_1",
      itemId: "item_1",
      status: "CONFIRMED",
    } as any);
    mockedItemUpdate.mockResolvedValue({} as any);
    mockedStatusLogCreate.mockResolvedValue({} as any);

    const rental = await confirmRentalAfterPayment("rental_1");

    expect(mockedRentalUpdate).toHaveBeenCalledWith({
      where: { id: "rental_1" },
      data: { status: "CONFIRMED" },
    });
    expect(mockedItemUpdate).toHaveBeenCalledWith({
      where: { id: "item_1" },
      data: { status: "RENTED" },
    });
    expect(mockedStatusLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        rentalId: "rental_1",
        oldStatus: "PENDING",
        newStatus: "CONFIRMED",
        note: expect.stringContaining("Payment successful"),
      }),
    });
    expect(rental?.status).toBe("CONFIRMED");
  });

  it("returns null when the rental does not exist", async () => {
    mockedRentalFindUnique.mockResolvedValue(null);

    const rental = await confirmRentalAfterPayment("missing");

    expect(rental).toBeNull();
    expect(mockedRentalUpdate).not.toHaveBeenCalled();
    expect(mockedItemUpdate).not.toHaveBeenCalled();
  });

  it("leaves a rental that is no longer PENDING untouched", async () => {
    const existing = { id: "rental_1", itemId: "item_1", status: "CONFIRMED" };
    mockedRentalFindUnique.mockResolvedValue(existing as any);

    const rental = await confirmRentalAfterPayment("rental_1");

    expect(rental).toEqual(existing);
    expect(mockedRentalUpdate).not.toHaveBeenCalled();
    expect(mockedItemUpdate).not.toHaveBeenCalled();
    expect(mockedStatusLogCreate).not.toHaveBeenCalled();
  });

  it("propagates an error if the rental update fails", async () => {
    mockedRentalFindUnique.mockResolvedValue({
      id: "rental_1",
      itemId: "item_1",
      status: "PENDING",
    } as any);
    mockedRentalUpdate.mockRejectedValue(new Error("Record not found"));

    await expect(confirmRentalAfterPayment("rental_1")).rejects.toThrow(
      "Record not found",
    );
    expect(mockedItemUpdate).not.toHaveBeenCalled();
  });
});

describe("markPaymentSuccessful()", () => {
  it("returns an unclaimed null payment when the transaction is unknown", async () => {
    mockedPaymentFindUnique.mockResolvedValue(null);

    const result = await markPaymentSuccessful("tx_missing", "chapa_ref");

    expect(result).toEqual({ payment: null, claimed: false });
    expect(mockedPaymentUpdateMany).not.toHaveBeenCalled();
  });

  it("does not claim (or re-confirm the rental) when the payment was already SUCCESS", async () => {
    const existing = { id: "pay_1", status: "SUCCESS", rentalId: "rental_1" };
    mockedPaymentFindUnique.mockResolvedValue(existing as any);
    mockedPaymentUpdateMany.mockResolvedValue({ count: 0 });

    const result = await markPaymentSuccessful("tx_1", "chapa_ref");

    expect(result).toEqual({ payment: existing, claimed: false });
    expect(mockedTransaction).not.toHaveBeenCalled();
  });

  it("claims a PENDING payment, flips it to SUCCESS and confirms the rental", async () => {
    const pending = { id: "pay_1", status: "PENDING", rentalId: "rental_1" };
    mockedPaymentFindUnique.mockResolvedValue(pending as any);
    mockedPaymentUpdateMany.mockResolvedValue({ count: 1 });
    mockedRentalFindUnique.mockResolvedValue({
      id: "rental_1",
      itemId: "item_1",
      status: "PENDING",
    } as any);
    mockedRentalUpdate.mockResolvedValue({
      id: "rental_1",
      itemId: "item_1",
    } as any);
    mockedItemUpdate.mockResolvedValue({} as any);
    mockedStatusLogCreate.mockResolvedValue({} as any);

    const result = await markPaymentSuccessful("tx_1", "chapa_ref_99");

    expect(mockedPaymentUpdateMany).toHaveBeenCalledWith({
      where: { id: "pay_1", status: { not: "SUCCESS" } },
      data: expect.objectContaining({
        status: "SUCCESS",
        metadata: expect.objectContaining({
          chapa_reference: "chapa_ref_99",
          processed_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        }),
      }),
    });
    expect(mockedRentalUpdate).toHaveBeenCalledWith({
      where: { id: "rental_1" },
      data: { status: "CONFIRMED" },
    });
    expect(result).toEqual({ payment: pending, claimed: true });
  });

  it("preserves existing metadata such as the checkout url", async () => {
    mockedPaymentFindUnique.mockResolvedValue({
      id: "pay_1",
      status: "PENDING",
      rentalId: null,
      metadata: { checkout_url: "https://checkout.chapa.co/abc" },
    } as any);
    mockedPaymentUpdateMany.mockResolvedValue({ count: 1 });

    await markPaymentSuccessful("tx_1", "chapa_ref");

    const call = mockedPaymentUpdateMany.mock.calls[0][0] as any;
    expect(call.data.metadata.checkout_url).toBe(
      "https://checkout.chapa.co/abc",
    );
  });

  it("does not confirm the rental if the payment update fails", async () => {
    mockedPaymentFindUnique.mockResolvedValue({
      id: "pay_1",
      status: "PENDING",
      rentalId: "rental_1",
    } as any);
    mockedPaymentUpdateMany.mockRejectedValue(new Error("Database error"));

    await expect(markPaymentSuccessful("tx_1", "chapa_ref")).rejects.toThrow(
      "Database error",
    );
    expect(mockedRentalUpdate).not.toHaveBeenCalled();
  });

  it("skips rental confirmation when the payment has no rental", async () => {
    mockedPaymentFindUnique.mockResolvedValue({
      id: "pay_1",
      status: "PENDING",
      rentalId: null,
    } as any);
    mockedPaymentUpdateMany.mockResolvedValue({ count: 1 });

    const result = await markPaymentSuccessful("tx_1", "chapa_ref");

    expect(result.claimed).toBe(true);
    expect(mockedRentalUpdate).not.toHaveBeenCalled();
  });
});

describe("handleSuccessfulPayment()", () => {
  it("returns null when the payment isn't found", async () => {
    mockedPaymentFindUnique.mockResolvedValue(null);

    const result = await handleSuccessfulPayment("tx_missing", "chapa_ref");

    expect(result).toBeNull();
  });

  it("returns the refreshed payment record after marking it successful", async () => {
    mockedPaymentFindUnique
      .mockResolvedValueOnce({
        id: "pay_1",
        status: "PENDING",
        rentalId: null,
      } as any)
      .mockResolvedValueOnce({ id: "pay_1", status: "SUCCESS" } as any);
    mockedPaymentUpdateMany.mockResolvedValue({ count: 1 });

    const result = await handleSuccessfulPayment("tx_1", "chapa_ref");

    expect(result).toEqual({ id: "pay_1", status: "SUCCESS" });
  });
});
