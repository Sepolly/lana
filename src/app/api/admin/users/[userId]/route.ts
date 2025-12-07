import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

const updateUserSchema = z.object({
  role: z.enum(["STUDENT", "ADMIN"]).optional(),
});

/**
 * PUT /api/admin/users/[userId]
 * Update user (e.g., change role)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const validationResult = updateUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid user data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const updateData: {
      role?: "STUDENT" | "ADMIN";
    } = {};

    if (validationResult.data.role) {
      updateData.role = validationResult.data.role;
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update user",
      },
      { status: 500 }
    );
  }
}
