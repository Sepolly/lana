import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { z } from "zod";

const verifyPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = verifyPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { password } = validationResult.data;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "No password set for this account. Please use the password reset feature.",
        },
        { status: 400 }
      );
    }

    try {
      const isPasswordValid = await verifyPassword(password, user.passwordHash);

      return NextResponse.json({
        success: true,
        valid: isPasswordValid,
      });
    } catch (error) {
      const isDevelopment = process.env.NODE_ENV === "development";
      if (isDevelopment) {
        console.error("Password verification error:", error);
      }
      return NextResponse.json(
        { success: false, valid: false, error: "An error occurred while verifying your password" },
        { status: 500 }
      );
    }
  } catch (error) {
    const isDevelopment = process.env.NODE_ENV === "development";
    if (isDevelopment) {
      console.error("Verify password error:", error);
    }
    return NextResponse.json(
      { success: false, valid: false, error: "Failed to verify password" },
      { status: 500 }
    );
  }
}
