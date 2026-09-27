import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/bcrypt";
import prisma from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Honeypot: bots fill hidden fields; humans never see this input.
    if (typeof body?.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { fullName, email, phone, password } = parsed.data;

    const existingUser = await prisma.endUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.endUser.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash,
        role: "STUDENT",
        isIdVerified: false,
      },
    });

    const accessToken = signAccessToken(newUser.id, newUser.role);
    const refreshToken = signRefreshToken(newUser.id, newUser.role);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        EndUserId: newUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          isIdVerified: newUser.isIdVerified,
        },
      },
      { status: 201 },
    );

    return setAuthCookies(response, accessToken, refreshToken);
  } catch (error) {
    logger.error({ err: error }, "Registration error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
