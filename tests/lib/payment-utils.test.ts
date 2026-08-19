import { describe, it, expect, vi, beforeEach } from "vitest";

import prismaMock from "./__mocks__/prisma";

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

const sendMock = vi.fn().mockResolvedValue({ id: "email_1" });
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

const mockedRentalUpdate = vi.mocked(prismaMock.rental.update);
const mockedItemUpdate = vi.mocked(prismaMock.item.update);
const mockedStatusLogCreate = vi.mocked(prismaMock.rentalStatusLog.create);
const mockedPaymentFindUnique = vi.mocked(prismaMock.payment.findUnique);
const mockedPaymentUpdate = vi.mocked(prismaMock.payment.update);

import {
  confirmRentalAfterPayment,
  handleSuccessfulPayment,
} from "@/lib/payment-utils";

describe("confirmRentalAfterPayment()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates rental to CONFIRMED, marks the item RENTED, and logs the transition", async () => {
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
        note: expect.any(String),
      }),
    });
    expect(rental.status).toBe("CONFIRMED");
  });

  it("propagates an error if the rental update fails (e.g. unknown id)", async () => {
    mockedRentalUpdate.mockRejectedValue(new Error("Record not found"));

    await expect(confirmRentalAfterPayment("missing")).rejects.toThrow(
      "Record not found",
    );
    expect(mockedItemUpdate).not.toHaveBeenCalled();
  });

  it("uses a default note when none is provided", async () => {
    mockedRentalUpdate.mockResolvedValue({
      id: "rental_1",
      itemId: "item_1",
      status: "CONFIRMED",
    } as any);
    mockedItemUpdate.mockResolvedValue({} as any);
    mockedStatusLogCreate.mockResolvedValue({} as any);

    await confirmRentalAfterPayment("rental_1");

    expect(mockedStatusLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        note: expect.stringContaining("Payment successful"),
      }),
    });
  });
});

describe("handleSuccessfulPayment()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null and does nothing further when the payment isn't found", async () => {
    mockedPaymentFindUnique.mockResolvedValue(null);

    const result = await handleSuccessfulPayment("tx_missing", "chapa_ref");

    expect(result).toBeNull();
    expect(mockedPaymentUpdate).not.toHaveBeenCalled();
    expect(mockedRentalUpdate).not.toHaveBeenCalled();
  });

  it("is idempotent: returns the existing payment without re-processing if already SUCCESS", async () => {
    const existing = { id: "pay_1", status: "SUCCESS", rentalId: "rental_1" };
    mockedPaymentFindUnique.mockResolvedValue(existing as any);

    const result = await handleSuccessfulPayment("tx_1", "chapa_ref");

    expect(result).toEqual(existing);
    expect(mockedPaymentUpdate).not.toHaveBeenCalled();
    expect(mockedRentalUpdate).not.toHaveBeenCalled();
  });

  it("marks a PENDING payment SUCCESS and confirms the associated rental", async () => {
    mockedPaymentFindUnique.mockResolvedValue({
      id: "pay_1",
      status: "PENDING",
      rentalId: "rental_1",
      rental: { id: "rental_1" },
    } as any);
    mockedPaymentUpdate.mockResolvedValue({
      id: "pay_1",
      status: "SUCCESS",
    } as any);
    mockedRentalUpdate.mockResolvedValue({
      id: "rental_1",
      itemId: "item_1",
    } as any);
    mockedItemUpdate.mockResolvedValue({} as any);
    mockedStatusLogCreate.mockResolvedValue({} as any);

    const result = await handleSuccessfulPayment("tx_1", "chapa_ref_99");

    expect(mockedPaymentUpdate).toHaveBeenCalledWith({
      where: { id: "pay_1" },
      data: expect.objectContaining({
        status: "SUCCESS",
        metadata: expect.objectContaining({
          chapa_reference: "chapa_ref_99",
        }),
      }),
    });
    expect(mockedRentalUpdate).toHaveBeenCalledWith({
      where: { id: "rental_1" },
      data: { status: "CONFIRMED" },
    });
    expect(result).toEqual({ id: "pay_1", status: "SUCCESS" });
  });

  it("stamps metadata.processed_at as an ISO date string", async () => {
    mockedPaymentFindUnique.mockResolvedValue({
      id: "pay_1",
      status: "PENDING",
      rentalId: "rental_1",
      rental: { id: "rental_1" },
    } as any);
    mockedPaymentUpdate.mockResolvedValue({} as any);
    mockedRentalUpdate.mockResolvedValue({
      id: "rental_1",
      itemId: "item_1",
    } as any);
    mockedItemUpdate.mockResolvedValue({} as any);
    mockedStatusLogCreate.mockResolvedValue({} as any);

    await handleSuccessfulPayment("tx_1", "chapa_ref");

    const call = mockedPaymentUpdate.mock.calls[0][0] as any;
    expect(() =>
      new Date(call.data.metadata.processed_at).toISOString(),
    ).not.toThrow();
    expect(call.data.metadata.processed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("does not confirm the rental if payment update fails", async () => {
    mockedPaymentFindUnique.mockResolvedValue({
      id: "pay_1",
      status: "PENDING",
      rentalId: "rental_1",
      rental: { id: "rental_1" },
    } as any);
    mockedPaymentUpdate.mockRejectedValue(new Error("Database error"));

    await expect(handleSuccessfulPayment("tx_1", "chapa_ref")).rejects.toThrow(
      "Database error",
    );
    expect(mockedRentalUpdate).not.toHaveBeenCalled();
  });

  it("handles rental being null gracefully", async () => {
    mockedPaymentFindUnique.mockResolvedValue({
      id: "pay_1",
      status: "PENDING",
      rentalId: null,
      rental: null,
    } as any);
    mockedPaymentUpdate.mockResolvedValue({
      id: "pay_1",
      status: "SUCCESS",
    } as any);

    const result = await handleSuccessfulPayment("tx_1", "chapa_ref");

    expect(result).toEqual({ id: "pay_1", status: "SUCCESS" });
    // Should NOT try to confirm a non-existent rental
    expect(mockedRentalUpdate).not.toHaveBeenCalled();
  });
});
