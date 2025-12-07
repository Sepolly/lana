import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/email";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = acceptInvitationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { token, password } = validationResult.data;

    const tokenData = await verifyToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired invitation token" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: tokenData.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "User is not an admin" },
        { status: 403 }
      );
    }

    if (user.passwordHash) {
      return NextResponse.json(
        { success: false, error: "Password already set" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password set successfully. You can now log in.",
    });
  } catch (error: unknown) {
    const isDevelopment = process.env.NODE_ENV === "development";
    if (isDevelopment) {
      console.error("Error accepting invitation:", error);
    } else {
      console.error("Error accepting invitation:", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return NextResponse.json(
      { success: false, error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

