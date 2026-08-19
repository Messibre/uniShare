import prisma from "@/lib/prisma";

export async function confirmRentalAfterPayment(rentalId: string) {
  // 1. Update rental status
  const rental = await prisma.rental.update({
    where: { id: rentalId },
    data: { status: "CONFIRMED" },
  });

  // 2. Update item status to RENTED
  await prisma.item.update({
    where: { id: rental.itemId },
    data: { status: "RENTED" },
  });

  // 3. Create status log
  await prisma.rentalStatusLog.create({
    data: {
      rentalId: rental.id,
      oldStatus: "PENDING",
      newStatus: "CONFIRMED",
      note: "Payment successful – rental confirmed",
    },
  });

  return rental;
}
export async function handleSuccessfulPayment(
  txRef: string,
  chapaReference: string,
) {
  const payment = await prisma.payment.findUnique({
    where: { txRef },
    include: { rental: true },
  });

  if (!payment) return null;
  if (payment.status === "SUCCESS") return payment;

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCESS",
      metadata: {
        chapa_reference: chapaReference,
        processed_at: new Date().toISOString(),
      },
    },
  });

  if (payment.rentalId) {
    await confirmRentalAfterPayment(payment.rentalId);
  }

  return updatedPayment;
}
