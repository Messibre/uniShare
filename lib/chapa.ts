import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";
import { logger } from "./logger";

const CHAPA_BASE_URL = "https://api.chapa.co/v1";
const CHAPA_SECRET_KEY = env.CHAPA_SECRET_KEY;

/**
 * Verify a Chapa webhook signature.
 *
 * Chapa signs the raw request body with HMAC-SHA256 using the webhook secret
 * configured in the dashboard and sends it in the `Chapa-Signature` (or
 * `x-chapa-signature`) header. We recompute the HMAC over the raw body and
 * compare in constant time.
 *
 * Returns `true` when no secret is configured so local/test environments that
 * have not set `CHAPA_WEBHOOK_SECRET` continue to work; callers should warn in
 * production when the secret is unset.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = env.CHAPA_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }
  if (!signatureHeader) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signatureHeader, "utf8");

  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, receivedBuf);
}

export interface InitializePaymentParams {
  amount: number;
  currency: string;
  tx_ref: string; //  unique reference
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, any>;
}

export interface InitializePaymentResponse {
  checkout_url: string;
  tx_ref: string;
}

export interface VerifyPaymentResponse {
  status: "success" | "failed" | "pending" | "cancelled";
  amount: string;
  currency: string;
  tx_ref: string;
  payment_method?: string;
}

/**
 * Initialize a payment
 */
export async function initializeChapaPayment(
  params: InitializePaymentParams,
): Promise<InitializePaymentResponse> {
  const {
    amount,
    currency,
    tx_ref,
    email,
    first_name,
    last_name,
    phone_number,
    callback_url,
    return_url,
    customization,
    meta,
  } = params;

  const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount.toString(),
      currency,
      tx_ref,
      email,
      first_name,
      last_name,
      phone_number,
      callback_url,
      return_url,
      customization: customization || {
        title: "UniShare",
        description: "campus rental payment",
      },
      meta: meta || {},
    }),
  });

  const data = await response.json();

  if (data.status !== "success") {
    logger.error({ response: data }, "Chapa v1 initialization failed");
    throw new Error(data.message || "Failed to initialize payment");
  }

  return {
    checkout_url: data.data.checkout_url,
    tx_ref: data.data.tx_ref,
  };
}

/**
 * Verify a payment
 */
export async function verifyChapaPayment(
  txRef: string,
): Promise<VerifyPaymentResponse | null> {
  try {
    const response = await fetch(
      `${CHAPA_BASE_URL}/transaction/verify/${txRef}`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        },
      },
    );

    const data = await response.json();

    if (data.status !== "success") {
      logger.error({ response: data, txRef }, "Chapa v1 verification failed");
      return null;
    }

    return {
      status: data.data.status,
      amount: data.data.amount,
      currency: data.data.currency,
      tx_ref: data.data.tx_ref,
      payment_method: data.data.payment_method,
    };
  } catch (error) {
    logger.error({ err: error, txRef }, "Error verifying Chapa v1 payment");
    return null;
  }
}

/**
 * Check if payment is valid
 */
export function isPaymentValid(
  verification: VerifyPaymentResponse,
  expectedAmount: number,
  expectedCurrency: string = "ETB",
): boolean {
  if (verification.status !== "success") {
    return false;
  }

  const verifiedAmount = parseFloat(verification.amount);
  if (verifiedAmount !== expectedAmount) {
    return false;
  }

  if (verification.currency !== expectedCurrency) {
    return false;
  }

  return true;
}
