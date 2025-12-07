import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createVerificationToken, sendAdminInvitationEmail } from "@/lib/email";
import { z } from "zod";

const addAdminSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: admins });
  } catch (error: unknown) {
    const isDevelopment = process.env.NODE_ENV === "development";
    if (isDevelopment) {
      console.error("Error fetching admins:", error);
    } else {
      console.error("Error fetching admins:", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return NextResponse.json({ success: false, error: "Failed to fetch admins" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = addAdminSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { email, name } = validationResult.data;

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.role === "ADMIN") {
        return NextResponse.json(
          { success: false, error: "User is already an admin" },
          { status: 409 }
        );
      }

      await db.user.update({
        where: { id: existingUser.id },
        data: { role: "ADMIN" },
      });

      return NextResponse.json({
        success: true,
        message: "User has been promoted to admin",
        data: { id: existingUser.id, email, name: existingUser.name },
      });
    }

    const token = await createVerificationToken(email);

    await db.user.create({
      data: {
        email,
        name,
        role: "ADMIN",
        emailVerified: null,
      },
    });

    try {
      await sendAdminInvitationEmail(email, name, token, session.user.name || "Admin");
    } catch (emailError: unknown) {
      const isDevelopment = process.env.NODE_ENV === "development";
      if (isDevelopment) {
        console.error("Failed to send admin invitation email:", emailError);
      } else {
        console.error("Failed to send admin invitation email:", {
          message: emailError instanceof Error ? emailError.message : String(emailError),
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Admin invitation sent successfully",
        data: { email, name },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const isDevelopment = process.env.NODE_ENV === "development";
    if (isDevelopment) {
      console.error("Error adding admin:", error);
    } else {
      console.error("Error adding admin:", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return NextResponse.json({ success: false, error: "Failed to add admin" }, { status: 500 });
  }
}
