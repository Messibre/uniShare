import prisma from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";
import { verifyChapaPayment, isPaymentValid } from "@/lib/chapa";
import { sendPaymentConfirmationEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export type FinalizeResult = {
  state: "success" | "failed" | "pending" | "not_found";
  rentalId?: string;
};

export async function confirmRentalAfterPayment(rentalId: string) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const current = await tx.rental.findUnique({ where: { id: rentalId } });
    if (!current) return null;
    if (current.status !== "PENDING") return current;

    const rental = await tx.rental.update({
      where: { id: rentalId },
      data: { status: "CONFIRMED" },
    });

    await tx.item.update({
      where: { id: rental.itemId },
      data: { status: "RENTED" },
    });

    await tx.rentalStatusLog.create({
      data: {
        rentalId: rental.id,
        oldStatus: "PENDING",
        newStatus: "CONFIRMED",
        note: "Payment successful – rental confirmed",
      },
    });

    return rental;
  });
}

/**
 * Marks a payment as paid exactly once. Returns `true` only for the call that
 * actually flipped the payment, so callers can send the confirmation email a
 * single time even when the webhook and the browser callback race.
 */
export async function markPaymentSuccessful(
  txRef: string,
  chapaReference: string,
) {
  const payment = await prisma.payment.findUnique({ where: { txRef } });
  if (!payment) return { payment: null, claimed: false };

  const claimed = await prisma.payment.updateMany({
    where: { id: payment.id, status: { not: "SUCCESS" } },
    data: {
      status: "SUCCESS",
      metadata: {
        ...((payment.metadata as Record<string, unknown> | null) ?? {}),
        chapa_reference: chapaReference,
        processed_at: new Date().toISOString(),
      },
    },
  });

  if (claimed.count === 0) return { payment, claimed: false };

  if (payment.rentalId) {
    await confirmRentalAfterPayment(payment.rentalId);
  }
  return { payment, claimed: true };
}

export async function handleSuccessfulPayment(
  txRef: string,
  chapaReference: string,
) {
  const { payment } = await markPaymentSuccessful(txRef, chapaReference);
  if (!payment) return null;
  return prisma.payment.findUnique({ where: { txRef } });
}

async function sendConfirmationFor(txRef: string) {
  const payment = await prisma.payment.findUnique({
    where: { txRef },
    include: { rental: { include: { item: true, renter: true } } },
  });
  if (!payment?.rental?.renter) return;

  try {
    await sendPaymentConfirmationEmail({
      email: payment.rental.renter.email,
      fullName: payment.rental.renter.fullName,
      rentalId: payment.rental.id,
      itemName: payment.rental.item.name,
      startDate: payment.rental.startDate,
      endDate: payment.rental.endDate,
      amount: payment.amount,
    });
  } catch (error) {
    logger.error(
      { err: error, txRef },
      "Payment confirmation email failed; payment itself is confirmed",
    );
  }
}

/**
 * Asks Chapa (the source of truth) for the outcome of a transaction and
 * reconciles our records: confirms the rental and emails the renter on
 * success, or marks the payment failed. Safe to call repeatedly.
 */
export async function finalizePayment(txRef: string): Promise<FinalizeResult> {
  const payment = await prisma.payment.findUnique({ where: { txRef } });
  if (!payment) return { state: "not_found" };

  if (payment.status === "SUCCESS") {
    return { state: "success", rentalId: payment.rentalId };
  }

  const verification = await verifyChapaPayment(txRef);
  if (!verification) {
    return { state: "pending", rentalId: payment.rentalId };
  }

  if (verification.status === "success") {
    if (!isPaymentValid(verification, payment.amount, "ETB")) {
      logger.error({ txRef }, "Chapa verification amount/currency mismatch");
      return { state: "failed", rentalId: payment.rentalId };
    }
    const { claimed } = await markPaymentSuccessful(txRef, txRef);
    if (claimed) await sendConfirmationFor(txRef);
    return { state: "success", rentalId: payment.rentalId };
  }

  if (verification.status === "failed" || verification.status === "cancelled") {
    await prisma.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: {
        status: "FAILED",
        metadata: {
          ...((payment.metadata as Record<string, unknown> | null) ?? {}),
          failure_status: verification.status,
          failed_at: new Date().toISOString(),
        },
      },
    });
    return { state: "failed", rentalId: payment.rentalId };
  }

  return { state: "pending", rentalId: payment.rentalId };
}
