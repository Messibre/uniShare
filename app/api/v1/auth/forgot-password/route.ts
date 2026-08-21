import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomUUID } from "crypto";

const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    // Find user (but don't reveal if not found – security)
    const user = await prisma.endUser.findUnique({
      where: { email, deletedAt: null },
    });

    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a reset link will be sent." },
        { status: 200 },
      );
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.deleteMany({
      where: { email, used: false },
    });

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
        used: false,
      },
    });

    const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const resetLink = `${appBaseUrl}/reset-password/${token}`;

    await sendPasswordResetEmail({
      email: user.email,
      fullName: user.fullName,
      resetLink,
    });

    return NextResponse.json(
      { message: "If an account exists, a reset link will be sent." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
