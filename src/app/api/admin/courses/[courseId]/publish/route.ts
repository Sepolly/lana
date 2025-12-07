import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendCourseAvailableEmail } from "@/lib/email";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

/**
 * POST /api/admin/courses/[courseId]/publish
 * Publish a course (make it available to users)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { courseId } = await params;

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        topics: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    // Check if course has topics
    if (course.topics.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot publish course without topics. Please add at least one topic." 
        },
        { status: 400 }
      );
    }

        // Publish course
    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    // Notify waitlisted users - match by career path
    // Check if any of the course's career paths match waitlist entries
    const allWaitlistEntries = await db.courseWaitlist.findMany({
      where: {
        notified: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Filter waitlist entries that match any of the course's career paths
    const waitlistedUsers = allWaitlistEntries.filter((entry) =>
      updatedCourse.careerPaths.some((cp) =>
        entry.careerPath.toLowerCase().includes(cp.toLowerCase()) ||
        cp.toLowerCase().includes(entry.careerPath.toLowerCase())
      )
    );

    // Send notifications to waitlisted users
    const notificationPromises = waitlistedUsers.map(async (waitlist) => {
      try {
        // Send email
        await sendCourseAvailableEmail(
          waitlist.email,
          waitlist.user.name || "Student",
          updatedCourse.title,
          updatedCourse.slug
        );

        // Create in-app notification
        await db.notification.create({
          data: {
            userId: waitlist.userId,
            type: "COURSE_AVAILABLE",
            title: "Course Now Available!",
            message: `"${updatedCourse.title}" is now available. Start learning now!`,
            link: `/courses/${updatedCourse.slug}`,
          },
        });

        // Mark waitlist as notified
        await db.courseWaitlist.update({
          where: { id: waitlist.id },
          data: {
            notified: true,
            notifiedAt: new Date(),
          },
        });
      } catch (error) {
        console.error(`Error notifying user ${waitlist.userId}:`, error);
        // Continue with other users even if one fails
      }
    });

    // Wait for all notifications to be sent (but don't fail if some fail)
    await Promise.allSettled(notificationPromises);

    return NextResponse.json({
      success: true,
      message: "Course published successfully",
      course: {
        id: updatedCourse.id,
        title: updatedCourse.title,
        isPublished: updatedCourse.isPublished,
        publishedAt: updatedCourse.publishedAt,
      },
      waitlistNotified: waitlistedUsers.length,
    });
  } catch (error) {
    console.error("Error publishing course:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to publish course" 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/courses/[courseId]/unpublish
 * Unpublish a course (make it unavailable to users)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { courseId } = await params;

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    // Unpublish course
    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: {
        isPublished: false,
        publishedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Course unpublished successfully",
      course: {
        id: updatedCourse.id,
        title: updatedCourse.title,
        isPublished: updatedCourse.isPublished,
      },
    });
  } catch (error) {
    console.error("Error unpublishing course:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to unpublish course" 
      },
      { status: 500 }
    );
  }
}

