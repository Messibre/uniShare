import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { chapaWebhookSchema } from "@/lib/validations";
import { verifyChapaPayment, isPaymentValid } from "@/lib/chapa";
import { handleSuccessfulPayment } from "@/lib/payment-utils";
import { sendPaymentConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = chapaWebhookSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Webhook validation failed:", parsed.error);
      return NextResponse.json(
        { error: "Invalid webhook format" },
        { status: 400 },
      );
    }

    const {
      event,
      status,
      merchant_reference: txRef,
      chapa_reference,
      amount: webhookAmount,
      currency: webhookCurrency,
    } = parsed.data;

    //  Verify webhook signature (optional but recommended)
    // Chapa provides a signature in headers: x-chapa-signature

    const dedupeKey = `${event}:${chapa_reference}:${status}`;
    const existingWebhook = await prisma.payment.findFirst({
      where: {
        txRef,
        metadata: {
          path: ["webhook_dedupe"],
          equals: dedupeKey,
        },
      },
    });

    if (existingWebhook) {
      return NextResponse.json(
        { message: "Already processed" },
        { status: 200 },
      );
    }

    //  ACK fast – respond immediately so Chapa doesn't retry

    const payment = await prisma.payment.findUnique({
      where: { txRef },
      include: { rental: true },
    });

    if (!payment) {
      console.error(`Payment record not found for txRef: ${txRef}`);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json(
        { message: "Already processed" },
        { status: 200 },
      );
    }

    const verification = await verifyChapaPayment(txRef);

    if (!verification) {
      console.error(`Verification failed for txRef: ${txRef}`);
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 400 },
      );
    }

    const isValid = isPaymentValid(verification, payment.amount, "ETB");

    if (!isValid) {
      console.error(`Payment verification failed for txRef: ${txRef}`);
      console.error(
        `Expected: ${payment.amount} ETB, Got: ${verification.amount} ${verification.currency}`,
      );
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 },
      );
    }

    await handleSuccessfulPayment(txRef, chapa_reference);
    const updatedPayment = await prisma.payment.findUnique({
      where: { txRef },
      include: {
        rental: {
          include: { item: true, renter: true },
        },
      },
    });

    if (updatedPayment && updatedPayment.rental) {
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
