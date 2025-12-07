import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const progressSchema = z.object({
  topicId: z.string(),
  enrollmentId: z.string().optional(), // Optional, we can look it up from session
  videoProgress: z.number().min(0).max(100).optional(),
  videoWatched: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// Update topic progress
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { slug } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = progressSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 });
    }

    const { topicId, videoProgress, videoWatched, isCompleted } = validationResult.data;

    // Get course and verify enrollment
    const course = await db.course.findUnique({
      where: { slug },
      select: { id: true, topics: { select: { id: true } } },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Update or create topic progress
    const topicProgress = await db.topicProgress.upsert({
      where: {
        enrollmentId_topicId: {
          enrollmentId: enrollment.id,
          topicId,
        },
      },
      update: {
        ...(videoProgress !== undefined && { videoProgress }),
        ...(videoWatched !== undefined && { videoWatched }),
        ...(isCompleted !== undefined && {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        }),
      },
      create: {
        enrollmentId: enrollment.id,
        topicId,
        videoProgress: videoProgress || 0,
        videoWatched: videoWatched || false,
        isCompleted: isCompleted || false,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // Update overall enrollment progress
    const allTopicProgress = await db.topicProgress.findMany({
      where: { enrollmentId: enrollment.id },
    });

    const totalTopics = course.topics.length;
    const completedTopics = allTopicProgress.filter((p) => p.isCompleted).length;
    const overallProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    const updatedEnrollment = await db.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: overallProgress,
        ...(overallProgress === 100 && {
          status: "COMPLETED",
          completedAt: new Date(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        topicProgress,
        overallProgress: updatedEnrollment.progress,
        isCompleted: updatedEnrollment.status === "COMPLETED",
      },
    });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update progress" },
      { status: 500 }
    );
  }
}

// Get progress for a course
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { slug } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const course = await db.course.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
      include: {
        topicProgress: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        enrollment,
        topicProgress: enrollment.topicProgress,
      },
    });
  } catch (error) {
    console.error("Progress fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
