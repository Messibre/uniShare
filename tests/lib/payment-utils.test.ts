import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma");

import prisma from "@/lib/prisma";
import { confirmRentalAfterPayment, handleSuccessfulPayment } from "@/lib/payment-utils";

const mockedRentalUpdate = vi.mocked(prisma.rental.update);
const mockedItemUpdate = vi.mocked(prisma.item.update);
const mockedStatusLogCreate = vi.mocked(prisma.rentalStatusLog.create);
const mockedPaymentFindUnique = vi.mocked(prisma.payment.findUnique);
const mockedPaymentUpdate = vi.mocked(prisma.payment.update);

describe("confirmRentalAfterPayment()", () => {
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
});

describe("handleSuccessfulPayment()", () => {
  it("returns null and does nothing further when the payment isn't found", async () => {
    mockedPaymentFindUnique.mockResolvedValue(null);
    const result = await handleSuccessfulPayment("tx_missing", "chapa_ref");
    expect(result).toBeNull();
    expect(mockedPaymentUpdate).not.toHaveBeenCalled();
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
    mockedPaymentUpdate.mockResolvedValue({ id: "pay_1", status: "SUCCESS" } as any);
    mockedRentalUpdate.mockResolvedValue({ id: "rental_1", itemId: "item_1" } as any);
    mockedItemUpdate.mockResolvedValue({} as any);
    mockedStatusLogCreate.mockResolvedValue({} as any);

    const result = await handleSuccessfulPayment("tx_1", "chapa_ref_99");

    expect(mockedPaymentUpdate).toHaveBeenCalledWith({
      where: { id: "pay_1" },
      data: expect.objectContaining({
        status: "SUCCESS",
        metadata: expect.objectContaining({ chapa_reference: "chapa_ref_99" }),
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
    mockedRentalUpdate.mockResolvedValue({ id: "rental_1", itemId: "item_1" } as any);
    mockedItemUpdate.mockResolvedValue({} as any);
    mockedStatusLogCreate.mockResolvedValue({} as any);

    await handleSuccessfulPayment("tx_1", "chapa_ref");

    const call = mockedPaymentUpdate.mock.calls[0][0] as any;
    expect(() => new Date(call.data.metadata.processed_at).toISOString()).not.toThrow();
  });
});
