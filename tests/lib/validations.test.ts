import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  createItemSchema,
  updateItemSchema,
  createRentalSchema,
  updateRentalStatusSchema,
  createChapaSession,
  initializePaymentSchema,
  chapaWebhookSchema,
} from "@/lib/validations";

describe("registerSchema", () => {
  const valid = {
    fullName: "Abebe Kebede",
    email: "abebe@example.com",
    phone: "0911111111",
    password: "password1",
  };

  it("accepts a fully valid payload", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a fullName shorter than 2 characters", () => {
    const result = registerSchema.safeParse({ ...valid, fullName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email address", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "pw1" });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no letters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "12345678" });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no numbers", () => {
    const result = registerSchema.safeParse({ ...valid, password: "passwordonly" });
    expect(result.success).toBe(false);
  });

  it("accepts a password exactly at the 8 character minimum", () => {
    const result = registerSchema.safeParse({ ...valid, password: "abcdefg1" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing password field", () => {
    const { password, ...rest } = valid;
    const result = registerSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("accepts an empty string phone (no format constraint on phone)", () => {
    const result = registerSchema.safeParse({ ...valid, phone: "" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-string fullName", () => {
    const result = registerSchema.safeParse({ ...valid, fullName: 12345 });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid email and non-empty password", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "x" }).success,
    ).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    const result = loginSchema.safeParse({ email: "a@b", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing email field entirely", () => {
    const result = loginSchema.safeParse({ password: "x" });
    expect(result.success).toBe(false);
  });
});

describe("createItemSchema", () => {
  const valid = {
    name: "Bicycle",
    category: "Sports",
    pricePerDay: 50,
  };

  it("accepts a minimal valid payload (optional fields omitted)", () => {
    expect(createItemSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a name shorter than 3 characters", () => {
    const result = createItemSchema.safeParse({ ...valid, name: "Bi" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty category", () => {
    const result = createItemSchema.safeParse({ ...valid, category: "" });
    expect(result.success).toBe(false);
  });

  it("rejects pricePerDay of 0", () => {
    const result = createItemSchema.safeParse({ ...valid, pricePerDay: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a negative pricePerDay", () => {
    const result = createItemSchema.safeParse({ ...valid, pricePerDay: -10 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric pricePerDay", () => {
    const result = createItemSchema.safeParse({ ...valid, pricePerDay: "50" });
    expect(result.success).toBe(false);
  });

  it("accepts an optional description and deposit", () => {
    const result = createItemSchema.safeParse({
      ...valid,
      description: "A nice bike",
      deposit: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed imageUrl", () => {
    const result = createItemSchema.safeParse({ ...valid, imageUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed imageUrl", () => {
    const result = createItemSchema.safeParse({
      ...valid,
      imageUrl: "https://example.com/bike.jpg",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateItemSchema", () => {
  it("accepts an empty object since every field is optional", () => {
    expect(updateItemSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a valid status enum value", () => {
    expect(
      updateItemSchema.safeParse({ status: "MAINTENANCE" }).success,
    ).toBe(true);
  });

  it("rejects an invalid status enum value", () => {
    const result = updateItemSchema.safeParse({ status: "DELETED" });
    expect(result.success).toBe(false);
  });

  it("rejects a name shorter than 3 characters when provided", () => {
    const result = updateItemSchema.safeParse({ name: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative pricePerDay when provided", () => {
    const result = updateItemSchema.safeParse({ pricePerDay: -1 });
    expect(result.success).toBe(false);
  });

  it("ignores unrelated fields it doesn't recognize but still validates known ones", () => {
    // zod's default object() strips unknown keys silently unless .strict() is used
    const result = updateItemSchema.safeParse({ name: "Valid Name", extra: "field" });
    expect(result.success).toBe(true);
  });
});

describe("createRentalSchema", () => {
  const valid = {
    itemId: "item_123",
    startDate: "2026-09-01T00:00:00.000Z",
    endDate: "2026-09-05T00:00:00.000Z",
  };

  it("accepts valid ISO datetime strings", () => {
    expect(createRentalSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty itemId", () => {
    const result = createRentalSchema.safeParse({ ...valid, itemId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a plain date without a time component", () => {
    const result = createRentalSchema.safeParse({ ...valid, startDate: "2026-09-01" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-date string", () => {
    const result = createRentalSchema.safeParse({ ...valid, startDate: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing endDate", () => {
    const { endDate, ...rest } = valid;
    const result = createRentalSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("updateRentalStatusSchema", () => {
  it("accepts a valid status with no note", () => {
    expect(
      updateRentalStatusSchema.safeParse({ status: "CONFIRMED" }).success,
    ).toBe(true);
  });

  it("accepts a valid status with a note", () => {
    expect(
      updateRentalStatusSchema.safeParse({ status: "CANCELLED", note: "changed my mind" })
        .success,
    ).toBe(true);
  });

  it("rejects an invalid status value", () => {
    const result = updateRentalStatusSchema.safeParse({ status: "PENDING" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing status field", () => {
    const result = updateRentalStatusSchema.safeParse({ note: "no status here" });
    expect(result.success).toBe(false);
  });

  it("is case-sensitive about the status enum", () => {
    const result = updateRentalStatusSchema.safeParse({ status: "confirmed" });
    expect(result.success).toBe(false);
  });
});

describe("createChapaSession", () => {
  const valid = {
    amount: 100,
    Currency: "ETB",
    merchant_reference: "ref_1",
    customer: {
      first_name: "A",
      last_name: "B",
      email: "a@b.com",
      phone_number: "0911111111",
    },
    meta: { user_id: "u1", rental_id: "r1" },
  };

  it("accepts a fully valid session payload", () => {
    expect(createChapaSession.safeParse(valid).success).toBe(true);
  });

  it("rejects a zero amount", () => {
    const result = createChapaSession.safeParse({ ...valid, amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid nested customer email", () => {
    const result = createChapaSession.safeParse({
      ...valid,
      customer: { ...valid.customer, email: "bad-email" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing merchant_reference", () => {
    const { merchant_reference, ...rest } = valid;
    const result = createChapaSession.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("initializePaymentSchema", () => {
  it("accepts a non-empty rentalId", () => {
    expect(initializePaymentSchema.safeParse({ rentalId: "r1" }).success).toBe(true);
  });

  it("rejects an empty rentalId", () => {
    expect(initializePaymentSchema.safeParse({ rentalId: "" }).success).toBe(false);
  });

  it("rejects a missing rentalId", () => {
    expect(initializePaymentSchema.safeParse({}).success).toBe(false);
  });
});

describe("chapaWebhookSchema", () => {
  const valid = {
    event: "charge.success",
    status: "success",
    merchant_reference: "rental_abc_123",
    chapa_reference: "chapa_ref_1",
    amount: "150.00",
    currency: "ETB",
    created_at: "2026-09-01T00:00:00.000Z",
  };

  it("accepts a valid webhook payload with only required fields", () => {
    expect(chapaWebhookSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional payment_method and updated_at when present", () => {
    const result = chapaWebhookSchema.safeParse({
      ...valid,
      payment_method: "telebirr",
      updated_at: "2026-09-01T01:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects amount sent as a number instead of a string", () => {
    const result = chapaWebhookSchema.safeParse({ ...valid, amount: 150 });
    expect(result.success).toBe(false);
  });

  it("rejects a missing chapa_reference", () => {
    const { chapa_reference, ...rest } = valid;
    const result = chapaWebhookSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
