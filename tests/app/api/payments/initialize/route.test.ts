import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma");
vi.mock("@/lib/auth-guard", () => ({
  requireAuth: vi.fn(),
}));
vi.mock("@/lib/chapa", () => ({
  initializeChapaPayment: vi.fn(),
}));

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { initializeChapaPayment } from "@/lib/chapa";
import { POST } from "@/app/api/payments/initialize/route";
import { makeRequest } from "@/test/helpers";

const mockedRequireAuth = vi.mocked(requireAuth);
const mockedRentalFindUnique = vi.mocked(prisma.rental.findUnique);
const mockedPaymentFindFirst = vi.mocked(prisma.payment.findFirst);
const mockedPaymentCreate = vi.mocked(prisma.payment.create);
const mockedPaymentUpdate = vi.mocked(prisma.payment.update);
const mockedInitChapa = vi.mocked(initializeChapaPayment);

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
      makeRequest("/api/payments/initialize", { method: "POST", body: { rentalId: "r1" } }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when the user isn't ID-verified", async () => {
    mockedRequireAuth.mockResolvedValue({ ...verifiedUser, isIdVerified: false } as any);
    const res = await POST(
      makeRequest("/api/payments/initialize", { method: "POST", body: { rentalId: "r1" } }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when the body fails validation", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    const res = await POST(
      makeRequest("/api/payments/initialize", { method: "POST", body: { rentalId: "" } }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when the rental doesn't exist", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue(null);
    const res = await POST(
      makeRequest("/api/payments/initialize", { method: "POST", body: { rentalId: "missing" } }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when the caller isn't the renter on the rental", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue({ ...pendingRental, renterId: "someone_else" } as any);
    const res = await POST(
      makeRequest("/api/payments/initialize", { method: "POST", body: { rentalId: "rental_1" } }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when the rental is not PENDING", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue({ ...pendingRental, status: "CONFIRMED" } as any);
    const res = await POST(
      makeRequest("/api/payments/initialize", { method: "POST", body: { rentalId: "rental_1" } }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/already CONFIRMED/);
  });

  it("returns 409 when a SUCCESS payment already exists", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue(pendingRental as any);
    mockedPaymentFindFirst.mockResolvedValue({ id: "pay_old", status: "SUCCESS" } as any);
    const res = await POST(
      makeRequest("/api/payments/initialize", { method: "POST", body: { rentalId: "rental_1" } }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already paid/i);
  });

  it("returns 409 with the existing paymentId when one is still PENDING", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue(pendingRental as any);
    mockedPaymentFindFirst.mockResolvedValue({ id: "pay_pending", status: "PENDING" } as any);
    const res = await POST(
      makeRequest("/api/payments/initialize", { method: "POST", body: { rentalId: "rental_1" } }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.paymentId).toBe("pay_pending");
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
      makeRequest("/api/payments/initialize", { method: "POST", body: { rentalId: "rental_1" } }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checkout_url).toBe("https://checkout.chapa.co/abc");
    expect(body.payment_id).toBe("pay_new");
  });

  it("splits fullName into first/last name for Chapa, defaulting last name to 'User'", async () => {
    mockedRequireAuth.mockResolvedValue({ ...verifiedUser, fullName: "Cher" } as any);
    mockedRentalFindUnique.mockResolvedValue(pendingRental as any);
    mockedPaymentFindFirst.mockResolvedValue(null);
    mockedPaymentCreate.mockResolvedValue({ id: "pay_new" } as any);
    mockedInitChapa.mockResolvedValue({ checkout_url: "url", tx_ref: "tx" });
    mockedPaymentUpdate.mockResolvedValue({} as any);

    await POST(makeRequest("/api/payments/initialize", { method: "POST", body: { rentalId: "rental_1" } }));

    const call = mockedInitChapa.mock.calls[0][0];
    expect(call.first_name).toBe("Cher");
    expect(call.last_name).toBe("User");
  });

  it("falls back to a placeholder phone number when the user has none", async () => {
    mockedRequireAuth.mockResolvedValue({ ...verifiedUser, phone: null } as any);
    mockedRentalFindUnique.mockResolvedValue(pendingRental as any);
    mockedPaymentFindFirst.mockResolvedValue(null);
    mockedPaymentCreate.mockResolvedValue({ id: "pay_new" } as any);
    mockedInitChapa.mockResolvedValue({ checkout_url: "url", tx_ref: "tx" });
    mockedPaymentUpdate.mockResolvedValue({} as any);

    await POST(makeRequest("/api/payments/initialize", { method: "POST", body: { rentalId: "rental_1" } }));

    const call = mockedInitChapa.mock.calls[0][0];
    expect(call.phone_number).toBe("+251900000000");
  });

  it("returns 500 when Chapa initialization throws", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockResolvedValue(pendingRental as any);
    mockedPaymentFindFirst.mockResolvedValue(null);
    mockedPaymentCreate.mockResolvedValue({ id: "pay_new" } as any);
    mockedInitChapa.mockRejectedValue(new Error("Chapa unreachable"));

    const res = await POST(
      makeRequest("/api/payments/initialize", { method: "POST", body: { rentalId: "rental_1" } }),
    );
    expect(res.status).toBe(500);
  });

  it("returns 500 on unexpected database errors", async () => {
    mockedRequireAuth.mockResolvedValue(verifiedUser as any);
    mockedRentalFindUnique.mockRejectedValue(new Error("db down"));
    const res = await POST(
      makeRequest("/api/payments/initialize", { method: "POST", body: { rentalId: "rental_1" } }),
    );
    expect(res.status).toBe(500);
  });
});
