import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

const addSectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  order: z.number().int().positive().optional(),
});

/**
 * POST /api/admin/courses/[courseId]/sections
 * Add a new section to a course
 * Note: Sections are implicit (grouped by topic.section field)
 * This endpoint helps organize topics into sections
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { courseId } = await params;
    const body = await request.json();
    const validationResult = addSectionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid section data",
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

    // Sections are stored in topics, so we just return the section info
    // Topics will be added with this section name
    const { name, order } = validationResult.data;

    // Get max section order if not provided
    let sectionOrder = order;
    if (!sectionOrder) {
      const existingSections = new Set(
        course.topics
          .map(t => t.section)
          .filter((s): s is string => s !== null)
      );
      sectionOrder = existingSections.size + 1;
    }

    return NextResponse.json({
      success: true,
      message: "Section ready to use",
      section: {
        name,
        order: sectionOrder,
      },
    });
  } catch (error) {
    console.error("Error adding section:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to add section" 
      },
      { status: 500 }
    );
  }
}

