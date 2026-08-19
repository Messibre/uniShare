import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const txRef = url.searchParams.get("tx_ref");
  const status = url.searchParams.get("status");

  // If we got a failure status from Chapa
  if (status === "failed" || status === "cancelled") {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Failed</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; background: #fef2f2; }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
            h1 { color: #dc2626; }
            .btn { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Payment Failed</h1>
            <p>Your payment was not successful. Don't worry – you can try again.</p>
            <a href="/dashboard" class="btn">Return to Dashboard</a>
          </div>
        </body>
      </html>
    `;
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Success path
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Processing Payment</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f8fafc;
          }
          .container {
            background: white;
            padding: 48px;
            border-radius: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            text-align: center;
            max-width: 480px;
          }
          .spinner {
            border: 4px solid #e2e8f0;
            border-top: 4px solid #2563eb;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h1 { color: #0f172a; font-size: 24px; margin-bottom: 8px; }
          p { color: #64748b; margin: 8px 0; }
          .btn {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 24px;
            font-weight: 500;
            transition: background 0.2s;
          }
          .btn:hover { background: #1d4ed8; }
          .success-check { color: #22c55e; font-size: 48px; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <h1>⏳ We're confirming your payment</h1>
          <p>Your payment is being processed by Chapa.</p>
          <p style="font-size: 14px; color: #94a3b8;">
            Reference: ${txRef || "N/A"}
          </p>
          <p style="font-size: 14px; color: #64748b; margin-top: 16px;">
            <strong>📧 You'll receive a confirmation email shortly.</strong>
          </p>
          <p style="font-size: 14px; color: #64748b;">
            You can also check your dashboard for updates.
          </p>
          <a href="/dashboard" class="btn">📊 Go to Dashboard</a>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
