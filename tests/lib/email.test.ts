import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn().mockResolvedValue({ id: "email_1" });

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

describe("email helpers", () => {
  beforeEach(() => {
    sendMock.mockClear();
  });

  describe("in development mode", () => {
    it("logs the email instead of calling Resend", async () => {
      vi.resetModules();
      vi.stubEnv("NODE_ENV", "development");
      const { sendPaymentConfirmationEmail } = await import("@/lib/email");

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await sendPaymentConfirmationEmail({
        email: "a@b.com",
        fullName: "A B",
        rentalId: "r1",
        itemName: "Bike",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-09-05"),
        amount: 200,
      });

      expect(sendMock).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });

  describe("outside development mode", () => {
    it("calls Resend.emails.send with the confirmation email content", async () => {
      vi.resetModules();
      vi.stubEnv("NODE_ENV", "production");
      const { sendPaymentConfirmationEmail } = await import("@/lib/email");

      await sendPaymentConfirmationEmail({
        email: "renter@example.com",
        fullName: "Renter Name",
        rentalId: "rental_42",
        itemName: "Tent",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-09-05"),
        amount: 500,
      });

      expect(sendMock).toHaveBeenCalledTimes(1);
      const call = sendMock.mock.calls[0][0];
      expect(call.to).toBe("renter@example.com");
      expect(call.subject).toContain("Tent");
      expect(call.html).toContain("Renter Name");
      expect(call.html).toContain("500");
      expect(call.html).toContain("rental_42");
    });

    it("calls Resend.emails.send with the failure email content, including reason", async () => {
      vi.resetModules();
      vi.stubEnv("NODE_ENV", "production");
      const { sendPaymentFailedEmail } = await import("@/lib/email");

      await sendPaymentFailedEmail({
        email: "renter@example.com",
        fullName: "Renter Name",
        itemName: "Tent",
        reason: "Card declined",
      });

      expect(sendMock).toHaveBeenCalledTimes(1);
      const call = sendMock.mock.calls[0][0];
      expect(call.subject).toContain("Tent");
      expect(call.html).toContain("Card declined");
    });

    it("omits the reason paragraph when no reason is given", async () => {
      vi.resetModules();
      vi.stubEnv("NODE_ENV", "production");
      const { sendPaymentFailedEmail } = await import("@/lib/email");

      await sendPaymentFailedEmail({
        email: "renter@example.com",
        fullName: "Renter Name",
        itemName: "Tent",
      });

      const call = sendMock.mock.calls[0][0];
      expect(call.html).not.toContain("<strong>Reason:</strong>");
    });

    it("propagates an error thrown by Resend rather than swallowing it", async () => {
      vi.resetModules();
      vi.stubEnv("NODE_ENV", "production");
      sendMock.mockRejectedValueOnce(new Error("Resend API down"));
      const { sendPaymentFailedEmail } = await import("@/lib/email");

      await expect(
        sendPaymentFailedEmail({
          email: "renter@example.com",
          fullName: "Renter Name",
          itemName: "Tent",
        }),
      ).rejects.toThrow("Resend API down");
    });
  });
});
