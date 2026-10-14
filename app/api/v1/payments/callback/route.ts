import { NextRequest, NextResponse } from "next/server";
import { finalizePayment } from "@/lib/payment-utils";
import { logger } from "@/lib/logger";

function redirectTo(path: string) {
  // Relative Location so the browser resolves it against the host it is
  // actually on, regardless of how APP_BASE_URL is configured.
  return new NextResponse(null, { status: 302, headers: { Location: path } });
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const txRef = params.get("tx_ref") || params.get("trx_ref");
  const status = params.get("status");

  if (!txRef) {
    return redirectTo("/dashboard");
  }

  try {
    const result = await finalizePayment(txRef);

    if (result.state === "not_found") {
      return redirectTo("/dashboard");
    }

    const target = result.rentalId ? `/rentals/${result.rentalId}` : "/dashboard";
    const outcome =
      result.state === "pending" && (status === "failed" || status === "cancelled")
        ? "failed"
        : result.state;

    return redirectTo(`${target}?payment=${outcome}`);
  } catch (error) {
    logger.error({ err: error, txRef }, "Payment callback error");
    return redirectTo("/dashboard?payment=pending");
  }
}
