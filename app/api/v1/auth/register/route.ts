import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/bcrypt";
import prisma from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
