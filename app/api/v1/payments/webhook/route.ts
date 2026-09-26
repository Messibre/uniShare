import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyChapaPayment,
  isPaymentValid,
  verifyWebhookSignature,
} from "@/lib/chapa";
import { handleSuccessfulPayment } from "@/lib/payment-utils";
import {
  sendPaymentConfirmationEmail,
  sendPaymentFailedEmail,
} from "@/lib/email";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("chapa-signature") ||
      req.headers.get("x-chapa-signature");

    if (!env.CHAPA_WEBHOOK_SECRET && env.NODE_ENV === "production") {
      logger.warn(
        { type: "webhook_secret_missing" },
        "CHAPA_WEBHOOK_SECRET is not set in production; webhook signatures are not being verified.",
      );
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      logger.warn(
        { type: "webhook_signature_invalid" },
        "Rejected Chapa webhook with invalid signature",
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { event, status, tx_ref, reference } = body;
    logger.info(
      { type: "webhook_received", event, status, tx_ref },
      "Chapa webhook received",
    );

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
      logger.error({ type: "webhook_payment_not_found", tx_ref }, "Payment not found");
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
        logger.error({ type: "webhook_verification_failed", tx_ref }, "Chapa verification failed");
        return NextResponse.json(
          { error: "Verification failed" },
          { status: 400 },
        );
      }

      const isValid = isPaymentValid(verification, payment.amount, "ETB");
      if (!isValid) {
        logger.error({ type: "webhook_verification_mismatch", tx_ref }, "Chapa verification mismatch");
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

    logger.info({ type: "webhook_ignored", event, status }, "Ignored webhook event");
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  } catch (error) {
    logger.error({ type: "webhook_error", error: String(error) }, "Webhook processing error");
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
