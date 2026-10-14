import { describe, it, expect, vi, beforeEach } from "vitest";
import prismaMock from "@/tests/lib/__mocks__/prisma";

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));
vi.mock("@/lib/auth-guard", () => ({
  requireAuth: vi.fn(),
}));
vi.mock("@/lib/chapa", () => ({
  initializeChapaPayment: vi.fn(),
}));
vi.mock("@/lib/payment-utils", () => ({
  finalizePayment: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { initializeChapaPayment } from "@/lib/chapa";
import { finalizePayment } from "@/lib/payment-utils";
import { POST } from "@/app/api/v1/payments/initialize/route";
import { makeRequest } from "@/tests/test/helpers";

const mockedRequireAuth = vi.mocked(requireAuth);
const mockedRentalFindUnique = vi.mocked(prisma.rental.findUnique);
const mockedPaymentFindFirst = vi.mocked(prisma.payment.findFirst);
const mockedPaymentCreate = vi.mocked(prisma.payment.create);
const mockedPaymentUpdate = vi.mocked(prisma.payment.update);
const mockedPaymentFindMany = vi.mocked(prisma.payment.findMany);
const mockedPaymentUpdateMany = vi.mocked(prisma.payment.updateMany);
const mockedFinalize = vi.mocked(finalizePayment);
const mockedInitChapa = vi.mocked(initializeChapaPayment);

beforeEach(() => {
  mockedPaymentFindMany.mockResolvedValue([]);
  mockedPaymentUpdateMany.mockResolvedValue({ count: 1 });
});

const verifiedUser = {
  id: "renter_1",
  email: "renter@example.com",
  fullName: "Jane Doe",
  phone: "0911111111",
  isIdVerified: true,
};

const pendingRental = {
  id: "rental_1",
  renterId: "renter_1",
  status: "PENDING",
  totalPrice: 300,
  item: { name: "Camera" },
};

describe("POST /api/payments/initialize", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedRequireAuth.mockRejectedValue(new Error("Unauthorized"));
    const res = await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "r1" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when the user isn't ID-verified", async () => {
    mockedRequireAuth.mockResolvedValue({
      ...verifiedUser,
      isIdVerified: false,
    } as any);
    const res = await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "r1" },
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when the body fails validation", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    const res = await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when the rental doesn't exist", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue(null);
    const res = await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "missing" },
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when the caller isn't the renter on the rental", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue({
      ...pendingRental,
      renterId: "someone_else",
    } as any);
    const res = await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "rental_1" },
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when the rental is not PENDING", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue({
      ...pendingRental,
      status: "CONFIRMED",
    } as any);
    const res = await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "rental_1" },
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/already CONFIRMED/);
  });

  it("returns 409 when a SUCCESS payment already exists", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue(pendingRental as any);
    mockedPaymentFindFirst.mockResolvedValue({
      id: "pay_old",
      status: "SUCCESS",
    } as any);
    const res = await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "rental_1" },
      }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already paid/i);
  });

  it("reuses a fresh PENDING checkout instead of creating a second payment", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue(pendingRental as any);
    mockedPaymentFindFirst.mockResolvedValue(null);
    mockedPaymentFindMany.mockResolvedValue([
      {
        id: "pay_pending",
        txRef: "tx_pending",
        createdAt: new Date(),
        metadata: { checkout_url: "https://checkout.chapa.co/existing" },
      },
    ] as any);
    mockedFinalize.mockResolvedValue({ state: "pending" });

    const res = await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "rental_1" },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checkout_url).toBe("https://checkout.chapa.co/existing");
    expect(body.payment_id).toBe("pay_pending");
    expect(mockedPaymentCreate).not.toHaveBeenCalled();
  });

  it("returns 409 when a pending checkout turns out to be paid on Chapa", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue(pendingRental as any);
    mockedPaymentFindFirst.mockResolvedValue(null);
    mockedPaymentFindMany.mockResolvedValue([
      { id: "pay_pending", txRef: "tx_pending", createdAt: new Date() },
    ] as any);
    mockedFinalize.mockResolvedValue({ state: "success", rentalId: "rental_1" });

    const res = await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "rental_1" },
      }),
    );

    expect(res.status).toBe(409);
  });

  it("expires a stale PENDING payment and starts a fresh checkout", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue(pendingRental as any);
    mockedPaymentFindFirst.mockResolvedValue(null);
    mockedPaymentFindMany.mockResolvedValue([
      {
        id: "pay_stale",
        txRef: "tx_stale",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        metadata: { checkout_url: "https://checkout.chapa.co/stale" },
      },
    ] as any);
    mockedFinalize.mockResolvedValue({ state: "pending" });
    mockedPaymentCreate.mockResolvedValue({ id: "pay_new" } as any);
    mockedInitChapa.mockResolvedValue({ checkout_url: "url", tx_ref: "tx" });
    mockedPaymentUpdate.mockResolvedValue({} as any);

    const res = await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "rental_1" },
      }),
    );

    expect(res.status).toBe(200);
    expect(mockedPaymentUpdateMany).toHaveBeenCalledWith({
      where: { id: "pay_stale", status: "PENDING" },
      data: { status: "FAILED" },
    });
    expect((await res.json()).payment_id).toBe("pay_new");
  });

  it("creates a PENDING payment and initializes Chapa on success", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue(pendingRental as any);
    mockedPaymentFindFirst.mockResolvedValue(null);
    mockedPaymentCreate.mockResolvedValue({ id: "pay_new" } as any);
    mockedInitChapa.mockResolvedValue({
      checkout_url: "https://checkout.chapa.co/abc",
      tx_ref: "rental_rental_1_123",
    });
    mockedPaymentUpdate.mockResolvedValue({} as any);

    const res = await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "rental_1" },
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checkout_url).toBe("https://checkout.chapa.co/abc");
    expect(body.payment_id).toBe("pay_new");
  });

  it("splits fullName into first/last name for Chapa, defaulting last name to 'User'", async () => {
    mockedRequireAuth.mockResolvedValue({
      ...verifiedUser,
      fullName: "Cher",
    } as any);
    mockedRentalFindUnique.mockResolvedValue(pendingRental as any);
    mockedPaymentFindFirst.mockResolvedValue(null);
    mockedPaymentCreate.mockResolvedValue({ id: "pay_new" } as any);
    mockedInitChapa.mockResolvedValue({ checkout_url: "url", tx_ref: "tx" });
    mockedPaymentUpdate.mockResolvedValue({} as any);

    await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "rental_1" },
      }),
    );

    const call = mockedInitChapa.mock.calls[0][0];
    expect(call.first_name).toBe("Cher");
    expect(call.last_name).toBe("User");
  });

  it("omits the phone number for Chapa when the user has none", async () => {
    mockedRequireAuth.mockResolvedValue({
      ...verifiedUser,
      phone: null,
    } as any);
    mockedRentalFindUnique.mockResolvedValue(pendingRental as any);
    mockedPaymentFindFirst.mockResolvedValue(null);
    mockedPaymentCreate.mockResolvedValue({ id: "pay_new" } as any);
    mockedInitChapa.mockResolvedValue({ checkout_url: "url", tx_ref: "tx" });
    mockedPaymentUpdate.mockResolvedValue({} as any);

    await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "rental_1" },
      }),
    );

    const call = mockedInitChapa.mock.calls[0][0];
    expect(call.phone_number).toBeUndefined();
  });

  it("returns 502 and marks the payment FAILED when Chapa initialization throws", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue(pendingRental as any);
    mockedPaymentFindFirst.mockResolvedValue(null);
    mockedPaymentCreate.mockResolvedValue({ id: "pay_new" } as any);
    mockedInitChapa.mockRejectedValue(new Error("Chapa unreachable"));

    const res = await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "rental_1" },
      }),
    );
    expect(res.status).toBe(502);
  });

  it("returns 500 on unexpected database errors", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockRejectedValue(new Error("db down"));
    const res = await POST(
      makeRequest("/api/payments/initialize", {
        method: "POST",
        body: { rentalId: "rental_1" },
      }),
    );
    expect(res.status).toBe(500);
  });
});
