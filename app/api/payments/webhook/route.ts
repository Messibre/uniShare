import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyChapaPayment, isPaymentValid } from "@/lib/chapa";
import { handleSuccessfulPayment } from "@/lib/payment-utils";
import {
  sendPaymentConfirmationEmail,
  sendPaymentFailedEmail,
} from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Chapa webhook received:", body);

    const { event, status, tx_ref, reference } = body;

    const payment = await prisma.payment.findUnique({
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

    if (!payment) {
      console.error(`Payment not found for tx_ref: ${tx_ref}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (event === "charge.success" && status === "success") {
      if (payment.status === "SUCCESS") {
        return NextResponse.json(
          { message: "Already processed" },
          { status: 200 },
        );
      }

      // Verify with Chapa (source of truth)
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
    }

    if (
      event === "charge.failed" ||
      event === "charge.cancelled" ||
      event === "charge.expired" ||
      status === "failed" ||
      status === "cancelled" ||
      status === "expired"
    ) {
      if (payment.status === "PENDING") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            metadata: {
              failure_event: event,
              failure_status: status,
              failure_reason: body.reason || body.message || "Payment failed",
              chapa_reference: reference,
              failed_at: new Date().toISOString(),
            },
          },
        });

        if (payment.rental?.renter) {
          await sendPaymentFailedEmail({
            email: payment.rental.renter.email,
            fullName: payment.rental.renter.fullName,
            itemName: payment.rental.item?.name || "Unknown item",
            reason:
              body.reason || body.message || "Payment declined by the provider",
          });
        }
      }

      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    console.log(`Ignored event: ${event} with status: ${status}`);
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
