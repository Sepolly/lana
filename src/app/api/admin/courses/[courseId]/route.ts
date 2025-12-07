import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

const updateCourseSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  skills: z.array(z.string()).optional(),
  careerPaths: z.array(z.string()).optional(),
});

/**
 * GET /api/admin/courses/[courseId]
 * Get course details with all topics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        topics: {
          orderBy: [{ sectionOrder: "asc" }, { order: "asc" }],
        },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      course,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch course",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/courses/[courseId]
 * Update course metadata
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;
    const body = await request.json();
    const validationResult = updateCourseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid course data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Verify course exists
    const existingCourse = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const updateData: {
      title?: string;
      description?: string;
      level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
      skills?: string[];
      careerPaths?: string[];
      slug?: string;
    } = {};

    if (validationResult.data.title) {
      updateData.title = validationResult.data.title;
      // Update slug if title changes
      const newSlug = slugify(validationResult.data.title);
      // Check if slug is available (or same as current)
      const slugExists = await db.course.findFirst({
        where: {
          slug: newSlug,
          NOT: { id: courseId },
        },
      });

      if (slugExists) {
        // Generate unique slug
        let finalSlug = newSlug;
        let counter = 1;
        while (
          await db.course.findFirst({
            where: { slug: finalSlug, NOT: { id: courseId } },
          })
        ) {
          finalSlug = `${newSlug}-${counter}`;
          counter++;
        }
        updateData.slug = finalSlug;
      } else {
        updateData.slug = newSlug;
      }
    }

    if (validationResult.data.description) {
      updateData.description = validationResult.data.description;
    }

    if (validationResult.data.level) {
      updateData.level = validationResult.data.level;
    }

    if (validationResult.data.skills) {
      updateData.skills = validationResult.data.skills;
    }

    if (validationResult.data.careerPaths) {
      updateData.careerPaths = validationResult.data.careerPaths;
    }

    // Update course
    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        topics: {
          orderBy: [{ sectionOrder: "asc" }, { order: "asc" }],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update course",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/courses/[courseId]
 * Delete a course and all its related data
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: {
            enrollments: true,
            certificates: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Check if course has enrollments or certificates
    if (course._count.enrollments > 0 || course._count.certificates > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete course with existing enrollments or certificates. Please unpublish the course instead.",
        },
        { status: 400 }
      );
    }

    // Delete course (cascade will handle topics, quizzes, etc.)
    await db.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete course",
      },
      { status: 500 }
    );
  }
}
