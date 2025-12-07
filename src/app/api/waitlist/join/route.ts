import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const joinWaitlistSchema = z.object({
  careerPath: z.string().min(1, "Career path is required"),
  email: z.string().email("Valid email is required"),
  consentToNotify: z.boolean().refine((val) => val === true, {
    message: "You must consent to receive notifications",
  }),
});

/**
 * POST /api/waitlist/join
 * Add user to waitlist for a course that's not yet available
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if courseWaitlist model is available
    if (!db.courseWaitlist) {
      console.error("courseWaitlist model not available in Prisma Client");
      return NextResponse.json(
        {
          success: false,
          error: "Database model not available. Please restart the server.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validationResult = joinWaitlistSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid waitlist data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { careerPath, email, consentToNotify } = validationResult.data;

    if (!consentToNotify) {
      return NextResponse.json(
        {
          success: false,
          error: "You must consent to receive notifications",
        },
        { status: 400 }
      );
    }

    // Check if user is already on waitlist for this career
    // Use findFirst instead of findUnique for composite unique constraint
    const existingWaitlist = await db.courseWaitlist.findFirst({
      where: {
        userId: session.user.id,
        careerPath,
      },
    });

    if (existingWaitlist) {
      return NextResponse.json({
        success: true,
        message: "You're already on the waitlist for this course",
        alreadyOnWaitlist: true,
      });
    }

    // Add user to waitlist
    const waitlist = await db.courseWaitlist.create({
      data: {
        userId: session.user.id,
        careerPath,
        email,
      },
    });

    // Create admin notification
    await db.adminNotification.create({
      data: {
        type: "WAITLIST_JOINED",
        title: "New Waitlist Signup",
        message: `${session.user.name || session.user.email} has joined the waitlist for "${careerPath}"`,
        link: `/admin/courses?careerPath=${encodeURIComponent(careerPath)}`,
        metadata: {
          userId: session.user.id,
          userName: session.user.name,
          userEmail: session.user.email,
          careerPath,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "You've been added to the waitlist! We'll notify you when this course becomes available.",
      waitlist: {
        id: waitlist.id,
        careerPath: waitlist.careerPath,
      },
    });
  } catch (error) {
    console.error("Error joining waitlist:", error);
    
    // Provide more specific error message if it's a Prisma model issue
    if (error instanceof Error && error.message.includes("courseWaitlist")) {
      return NextResponse.json(
        {
          success: false,
          error: "Database model not available. Please restart the development server.",
          details: error.message,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to join waitlist",
      },
      { status: 500 }
    );
  }
}

