import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { initializePaymentSchema } from "@/lib/validations";
import { initializeChapaPayment } from "@/lib/chapa";
import { finalizePayment } from "@/lib/payment-utils";
import { logger } from "@/lib/logger";

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

    const paid = await prisma.payment.findFirst({
      where: { rentalId: rental.id, status: "SUCCESS" },
    });
    if (paid) {
      return NextResponse.json(
        { error: "Rental already paid for" },
        { status: 409 },
      );
    }

    // A checkout the user abandoned must not block them from paying again:
    // reconcile it with Chapa, reuse it if it is still fresh, otherwise expire it.
    const pendingPayments = await prisma.payment.findMany({
      where: { rentalId: rental.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    for (const pending of pendingPayments) {
      const outcome = await finalizePayment(pending.txRef);
      if (outcome.state === "success") {
        return NextResponse.json(
          { error: "Rental already paid for" },
          { status: 409 },
        );
      }

      const checkoutUrl = (pending.metadata as { checkout_url?: string } | null)
        ?.checkout_url;
      const isFresh = Date.now() - pending.createdAt.getTime() < 30 * 60 * 1000;

      if (outcome.state === "pending" && checkoutUrl && isFresh) {
        return NextResponse.json(
          {
            checkout_url: checkoutUrl,
            payment_id: pending.id,
            tx_ref: pending.txRef,
          },
          { status: 200 },
        );
      }

      await prisma.payment.updateMany({
        where: { id: pending.id, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }

    const txRef = `rental_${rental.id}_${Date.now()}`;

    const payment = await prisma.payment.create({
      data: {
        rentalId: rental.id,
        EndUserId: user.id,
        amount: rental.totalPrice,
        txRef: txRef,
        type: "RENTAL_FEE",
        status: "PENDING",
      },
    });

    const appUrl = (
      process.env.APP_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_BASE_URL ||
      req.nextUrl.origin
    ).replace(/\/$/, "");

    // Chapa only accepts letters, numbers, spaces, dots, hyphens and underscores
    const safeItemName = rental.item.name
      .replace(/[^A-Za-z0-9 ._-]/g, "")
      .trim()
      .slice(0, 40);

    const phone = user.phone?.replace(/\s+/g, "");
    const validPhone =
      phone && /^(\+251|0)?[79]\d{8}$/.test(phone) ? phone : undefined;

    let chapaResponse;
    try {
      chapaResponse = await initializeChapaPayment({
        amount: rental.totalPrice,
        currency: "ETB",
        tx_ref: txRef,
        email: user.email,
        first_name: user.fullName.split(" ")[0] || "UniShare",
        last_name: user.fullName.split(" ").slice(1).join(" ") || "User",
        phone_number: validPhone,
        callback_url: `${appUrl}/api/v1/payments/webhook`,
        return_url: `${appUrl}/api/v1/payments/callback?tx_ref=${txRef}`,
        customization: {
          title: "UniShare",
          description: `Rental ${safeItemName || "item"}`.slice(0, 50),
        },
        meta: {
          rental_id: rental.id,
          user_id: user.id,
          payment_id: payment.id,
        },
      });
    } catch (chapaError) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      logger.error({ err: chapaError }, "Chapa initialization failed");
      return NextResponse.json(
        {
          error:
            chapaError instanceof Error
              ? chapaError.message
              : "Payment provider is unavailable",
        },
        { status: 502 },
      );
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          checkout_url: chapaResponse.checkout_url,
          tx_ref: chapaResponse.tx_ref,
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
    logger.error({ err: error }, "POST /api/payments/initialize error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
