import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureUserExists } from "@/lib/ensure-user";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phoneNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  school: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(), // ISO date string
});

// GET - Fetch user profile with personal information
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user data
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch student profile
    const profile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        phoneNumber: true,
        address: true,
        school: true,
        dateOfBirth: true,
        learningStyle: true,
        interests: true,
        strengths: true,
        weaknesses: true,
        aptitudeCompleted: true,
        completedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        image: user.image,
        phoneNumber: profile?.phoneNumber || null,
        address: profile?.address || null,
        school: profile?.school || null,
        dateOfBirth: profile?.dateOfBirth 
          ? profile.dateOfBirth.toISOString().split('T')[0] // Format as YYYY-MM-DD
          : null,
        learningStyle: profile?.learningStyle || null,
        interests: profile?.interests || [],
        strengths: profile?.strengths || [],
        weaknesses: profile?.weaknesses || [],
        aptitudeCompleted: profile?.aptitudeCompleted || false,
        completedAt: profile?.completedAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT/PATCH - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Ensure user exists in database
    await ensureUserExists({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    });

    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { name, phoneNumber, address, school, dateOfBirth } = validationResult.data;

    // Update user name if provided
    if (name !== undefined) {
      await db.user.update({
        where: { id: session.user.id },
        data: { name },
      });
    }

    // Update or create student profile
    const dateOfBirthDate = dateOfBirth 
      ? new Date(dateOfBirth) 
      : null;

    const updatedProfile = await db.studentProfile.upsert({
      where: { userId: session.user.id },
      update: {
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(address !== undefined && { address }),
        ...(school !== undefined && { school }),
        ...(dateOfBirthDate !== undefined && { dateOfBirth: dateOfBirthDate }),
      },
      create: {
        userId: session.user.id,
        phoneNumber: phoneNumber || null,
        address: address || null,
        school: school || null,
        dateOfBirth: dateOfBirthDate,
      },
    });

    // Fetch updated user data
    const updatedUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        name: updatedUser?.name,
        email: updatedUser?.email,
        phoneNumber: updatedProfile.phoneNumber,
        address: updatedProfile.address,
        school: updatedProfile.school,
        dateOfBirth: updatedProfile.dateOfBirth 
          ? updatedProfile.dateOfBirth.toISOString().split('T')[0]
          : null,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// Support PATCH method as well
export async function PATCH(request: NextRequest) {
  return PUT(request);
}

