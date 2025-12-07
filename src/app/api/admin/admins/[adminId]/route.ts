import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { adminId } = await params;

    if (session.user.id !== adminId) {
      return NextResponse.json(
        { success: false, error: "You can only update your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "updatePassword") {
      const validationResult = updatePasswordSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: validationResult.error.issues[0].message,
          },
          { status: 400 }
        );
      }

      const { currentPassword, newPassword } = validationResult.data;

      // Trim passwords to avoid whitespace issues
      const trimmedCurrentPassword = currentPassword.trim();
      const trimmedNewPassword = newPassword.trim();

      const user = await db.user.findUnique({
        where: { id: adminId },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      if (!user.passwordHash) {
        return NextResponse.json(
          { success: false, error: "No password set for this account. Please use the password reset feature." },
          { status: 400 }
        );
      }

      try {
        const isPasswordValid = await verifyPassword(
          trimmedCurrentPassword,
          user.passwordHash
        );

        if (!isPasswordValid) {
          const isDevelopment = process.env.NODE_ENV === "development";
          if (isDevelopment) {
            console.error("Password verification failed:", {
              userId: adminId,
              userEmail: user.email,
              hasPasswordHash: !!user.passwordHash,
              passwordHashLength: user.passwordHash?.length,
              passwordHashPrefix: user.passwordHash?.substring(0, 10),
            });
          }
          return NextResponse.json(
            { success: false, error: "Current password is incorrect. Please check your password and try again." },
            { status: 400 }
          );
        }
      } catch (verifyError: unknown) {
        const isDevelopment = process.env.NODE_ENV === "development";
        if (isDevelopment) {
          console.error("Password verification error:", verifyError);
        }
        return NextResponse.json(
          { success: false, error: "An error occurred while verifying your password" },
          { status: 500 }
        );
      }

      const newPasswordHash = await hashPassword(trimmedNewPassword);

      await db.user.update({
        where: { id: adminId },
        data: { passwordHash: newPasswordHash },
      });

      return NextResponse.json({
        success: true,
        message: "Password updated successfully",
      });
    }

    if (action === "updateProfile") {
      const validationResult = updateProfileSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: validationResult.error.issues[0].message,
          },
          { status: 400 }
        );
      }

      const updateData: { name?: string; email?: string } = {};

      if (body.name) {
        updateData.name = body.name;
      }

      if (body.email) {
        if (body.email !== session.user.email) {
          const existingUser = await db.user.findUnique({
            where: { email: body.email },
          });

          if (existingUser) {
            return NextResponse.json(
              { success: false, error: "Email already in use" },
              { status: 409 }
            );
          }

          updateData.email = body.email;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { success: false, error: "No fields to update" },
          { status: 400 }
        );
      }

      await db.user.update({
        where: { id: adminId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const isDevelopment = process.env.NODE_ENV === "development";
    if (isDevelopment) {
      console.error("Error updating admin:", error);
    } else {
      console.error("Error updating admin:", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return NextResponse.json(
      { success: false, error: "Failed to update admin" },
      { status: 500 }
    );
  }
}

