import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { initializePaymentSchema } from "@/lib/validations";
import { initializeChapaPayment } from "@/lib/chapa";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (!user.isIdVerified) {
      return NextResponse.json(
        { error: "Must verify your ID before making payments" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = initializePaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { rentalId } = parsed.data;

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { item: true },
    });

    if (!rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 });
    }

    if (rental.renterId !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to pay for this rental" },
        { status: 403 },
      );
    }

    if (rental.status !== "PENDING") {
      return NextResponse.json(
        { error: `Rental is already ${rental.status}` },
        { status: 400 },
      );
    }

    const existingPayment = await prisma.payment.findFirst({
      where: {
        rentalId: rental.id,
        status: { in: ["PENDING", "SUCCESS"] },
      },
    });

    if (existingPayment) {
      if (existingPayment.status === "SUCCESS") {
        return NextResponse.json(
          { error: "Rental already paid for" },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          error: "Payment already in progress",
          paymentId: existingPayment.id,
        },
        { status: 409 },
      );
    }

    const txRef = `rental_${rental.id}_${Date.now()}`;

    const payment = await prisma.payment.create({
      data: {
        rentalId: rental.id,
        EndUserId: user.id,
        amount: rental.totalPrice,
        txRef,
        type: "RENTAL_FEE",
        status: "PENDING",
      },
    });

    const idempotencyKey = randomUUID();

    const chapaResponse = await initializeChapaPayment({
      amount: rental.totalPrice,
      currency: "ETB",
      merchant_reference: txRef,
      customer: {
        first_name: user.fullName.split(" ")[0],
        last_name: user.fullName.split(" ").slice(1).join(" ") || "User",
        email: user.email,
        phone_number: user.phone || "+251900000000",
      },
      meta: {
        rental_id: rental.id,
        user_id: user.id,
        payment_id: payment.id,
      },
      idempotencyKey,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          checkout_url: chapaResponse.checkout_url,
          expires_at: chapaResponse.expires_at,
          idempotency_key: idempotencyKey,
        },
      },
    });

    return NextResponse.json(
      {
        checkout_url: chapaResponse.checkout_url,
        payment_id: payment.id,
        tx_ref: txRef,
      },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/payments/initialize error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
