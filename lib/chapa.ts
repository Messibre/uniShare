import { randomUUID } from "crypto";

const CHAPA_BASE_URL = "https://api.chapa.global/v2";
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY!;

export interface ChapaCustomer {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

export interface InitializePaymentParams {
  amount: number;
  currency: string;
  merchant_reference: string; // Our tx_ref
  customer: ChapaCustomer;
  meta?: Record<string, any>;
  idempotencyKey?: string; // Unique per attempt (prevents double charges)
}

export interface InitializePaymentResponse {
  checkout_url: string;
  expires_at: string;
}

export interface VerifyPaymentResponse {
  status: "success" | "failed" | "pending" | "cancelled";
  amount: string;
  currency: string;
  merchant_reference: string;
  chapa_reference: string;
  payment_method?: string;
}

export async function initializeChapaPayment(
  params: InitializePaymentParams,
): Promise<InitializePaymentResponse> {
  const {
    amount,
    currency,
    merchant_reference,
    customer,
    meta,
    idempotencyKey,
  } = params;

  // Generate an idempotency key if not provided
  // This ensures retries don't create duplicate charges
  const idempotencyKeyToUse = idempotencyKey || randomUUID();

  const response = await fetch(`${CHAPA_BASE_URL}/payments/hosted`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKeyToUse, // ← CRITICAL!
    },
    body: JSON.stringify({
      amount,
      currency,
      merchant_reference,
      customer: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone_number: customer.phone_number,
      },
      meta: meta || {},
    }),
  });

  const data = await response.json();

  if (!response.ok || data.status !== "success") {
    console.error("Chapa initialization failed:", data);
    throw new Error(data.message || "Failed to initialize payment");
  }

  return {
    checkout_url: data.data.checkout_url,
    expires_at: data.data.expires_at,
  };
}

export async function verifyChapaPayment(
  merchantReference: string,
): Promise<VerifyPaymentResponse | null> {
  try {
    const response = await fetch(
      `${CHAPA_BASE_URL}/payments/${merchantReference}/verify`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      console.error("Chapa verification failed:", data);
      return null;
    }

    return {
      status: data.data.status,
      amount: data.data.amount,
      currency: data.data.currency,
      merchant_reference: data.data.merchant_reference,
      chapa_reference: data.data.chapa_reference,
      payment_method: data.data.payment_method,
    };
  } catch (error) {
    console.error("Error verifying Chapa payment:", error);
    return null;
  }
}

export function isPaymentValid(
  verification: VerifyPaymentResponse,
  expectedAmount: number,
  expectedCurrency: string = "ETB",
): boolean {
  // Chapa sends amount as string, parse it
  const verifiedAmount = parseFloat(verification.amount);

  // Check 1: Payment status must be success
  if (verification.status !== "success") {
    return false;
  }

  // Check 2: Amount must match exactly (no rounding errors)
  if (verifiedAmount !== expectedAmount) {
    return false;
  }

  // Check 3: Currency must match
  if (verification.currency !== expectedCurrency) {
    return false;
  }

  return true;
}
