import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@unishare.com";

const isDev = process.env.NODE_ENV === "development";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailParams) {
  if (isDev) {
    console.log("📧 [DEV] Email would be sent:");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  HTML: ${html.substring(0, 200)}...`);
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

export async function sendPaymentConfirmationEmail({
  email,
  fullName,
  rentalId,
  itemName,
  startDate,
  endDate,
  amount,
}: {
  email: string;
  fullName: string;
  rentalId: string;
  itemName: string;
  startDate: Date;
  endDate: Date;
  amount: number;
}) {
  const subject = `✅ UniShare – Rental Confirmed: ${itemName}`;

  const startFormatted = startDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const endFormatted = endDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .highlight { font-weight: bold; color: #2563eb; }
        </style>
      </head>
      <body>
        <h1>✅ Payment Confirmed!</h1>
        <p>Hi ${fullName},</p>
        <p>Your payment has been successfully processed. Your rental is now <strong>CONFIRMED</strong>!</p>

        <div class="card">
          <h3>📦 Rental Details</h3>
          <p><strong>Item:</strong> ${itemName}</p>
          <p><strong>Dates:</strong> ${startFormatted} → ${endFormatted}</p>
          <p><strong>Total Paid:</strong> ${amount} ETB</p>
          <p><strong>Rental ID:</strong> ${rentalId}</p>
        </div>

        <h3>📋 What's Next?</h3>
        <ol>
          <li>The owner will prepare your item for pickup.</li>
          <li>Coordinate with the owner for pickup/delivery.</li>
          <li>Enjoy your rental! 🎉</li>
        </ol>

        <p>
          <a href="${process.env.APP_BASE_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View My Rentals
          </a>
        </p>

        <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
          This is an automated message from UniShare. If you didn't make this payment, please contact us immediately.
        </p>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
}

export async function sendPaymentFailedEmail({
  email,
  fullName,
  itemName,
  reason,
}: {
  email: string;
  fullName: string;
  itemName: string;
  reason?: string;
}) {
  const subject = `❌ UniShare – Payment Failed: ${itemName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #dc2626; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>❌ Payment Failed</h1>
        <p>Hi ${fullName},</p>
        <p>Your payment for <strong>${itemName}</strong> was not successful.</p>

        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}

        <p>Don't worry – you can try again by going to your dashboard.</p>

        <p>
          <a href="${process.env.APP_BASE_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Return to Dashboard
          </a>
        </p>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
}
