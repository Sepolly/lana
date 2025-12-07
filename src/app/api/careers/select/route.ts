import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processCareerSelection, type RecommendedCareer } from "@/lib/career-recommendation-engine";
import { z } from "zod";

const selectCareerSchema = z.object({
  career: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    matchScore: z.number(),
    reasoning: z.string().optional(),
    skills: z.array(z.string()),
    category: z.string().optional(),
    averageSalary: z.string().optional(),
    growthOutlook: z.string().optional(),
  }),
});

/**
 * POST /api/careers/select
 * When user selects a career from recommendations:
 * 1. Get or create a course for that career (with YouTube videos)
 * 2. Return the course details
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

    const body = await request.json();
    const validationResult = selectCareerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid career data" },
        { status: 400 }
      );
    }

    const { career } = validationResult.data;

    console.log(`User ${session.user.id} selected career: ${career.title}`);

    // Process career selection - this will:
    // 1. Check if a published, admin-curated course exists for this career
    // 2. If found, update user's profile with recommended course
    // 3. If not found, return error (no AI generation)
    const generatedCourse = await processCareerSelection(
      session.user.id,
      career as RecommendedCareer
    );

    if (!generatedCourse) {
      return NextResponse.json({
        success: false,
        error: "Course not available",
        message: `A course for "${career.title}" is not available yet.`,
        courseNotAvailable: true,
        careerPath: career.title,
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Found course for your career path",
      data: {
        course: generatedCourse,
        isNew: generatedCourse.isNew,
      },
    });
  } catch (error) {
    console.error("Career selection error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process career selection" },
      { status: 500 }
    );
  }
}

