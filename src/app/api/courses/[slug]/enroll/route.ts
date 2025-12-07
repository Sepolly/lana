import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { slug } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Find the course
    const course = await db.course.findUnique({
      where: { slug },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json({
        success: true,
        message: "Already enrolled",
        enrollment: existingEnrollment,
      });
    }

    // Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        userId: session.user.id,
        courseId: course.id,
        status: "ACTIVE",
        progress: 0,
      },
      include: {
        topicProgress: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Enrolled successfully",
      enrollment,
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json({ success: false, error: "Failed to enroll" }, { status: 500 });
  }
}
