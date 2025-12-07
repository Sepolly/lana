import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

const reorderTopicsSchema = z.object({
  topics: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().positive(),
      section: z.string().nullable().optional(),
      sectionOrder: z.number().int().positive().nullable().optional(),
    })
  ),
});

/**
 * POST /api/admin/courses/[courseId]/topics/reorder
 * Reorder topics within a course
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { courseId } = await params;
    const body = await request.json();
    const validationResult = reorderTopicsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid reorder data",
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { topics: true },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    // Update all topics in a transaction
    const updates = validationResult.data.topics.map((topicUpdate) =>
      db.topic.update({
        where: { id: topicUpdate.id },
        data: {
          order: topicUpdate.order,
          section: topicUpdate.section ?? null,
          sectionOrder: topicUpdate.sectionOrder ?? null,
        },
      })
    );

    await db.$transaction(updates);

    // Reload course with updated topics
    const updatedCourse = await db.course.findUnique({
      where: { id: courseId },
      include: {
        topics: {
          orderBy: [
            { sectionOrder: "asc" },
            { order: "asc" },
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Topics reordered successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Error reordering topics:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to reorder topics" 
      },
      { status: 500 }
    );
  }
}

