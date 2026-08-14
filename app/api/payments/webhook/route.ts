import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyChapaPayment, isPaymentValid } from "@/lib/chapa";
import { handleSuccessfulPayment } from "@/lib/payment-utils";
import { sendPaymentConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Chapa webhook received:", body);

    const { event, status, tx_ref, reference } = body;

    if (event !== "charge.success" && status !== "success") {
      return NextResponse.json({ message: "Ignored" }, { status: 200 });
    }

    const payment = await prisma.payment.findUnique({
      where: { txRef: tx_ref },
      include: { rental: { include: { item: true, renter: true } } },
    });

    if (!payment) {
      console.error(`Payment not found for tx_ref: ${tx_ref}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json(
        { message: "Already processed" },
        { status: 200 },
      );
    }

    const verification = await verifyChapaPayment(tx_ref);
    if (!verification) {
      console.error(`Verification failed for tx_ref: ${tx_ref}`);
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 },
      );
    }

    const isValid = isPaymentValid(verification, payment.amount, "ETB");
    if (!isValid) {
      console.error(`Verification mismatch for tx_ref: ${tx_ref}`);
      return NextResponse.json(
        { error: "Verification mismatch" },
        { status: 400 },
      );
    }

    await handleSuccessfulPayment(tx_ref, reference || "chapa_ref");

    const updatedPayment = await prisma.payment.findUnique({
      where: { txRef: tx_ref },
      include: {
        rental: {
          include: {
            item: true,
            renter: true,
          },
        },
      },
    });

    if (updatedPayment?.rental?.renter) {
      await sendPaymentConfirmationEmail({
        email: updatedPayment.rental.renter.email,
        fullName: updatedPayment.rental.renter.fullName,
        rentalId: updatedPayment.rental.id,
        itemName: updatedPayment.rental.item.name,
        startDate: updatedPayment.rental.startDate,
        endDate: updatedPayment.rental.endDate,
        amount: updatedPayment.amount,
      });
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
