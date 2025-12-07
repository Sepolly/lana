import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const createCourseSchema = z.object({
  careerPath: z.string().min(1, "Career path is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  skills: z.array(z.string()).default([]),
});

/**
 * POST /api/admin/courses/create
 * Create a new course from a Pinecone career
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createCourseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid course data",
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { careerPath, title, description, level, skills } = validationResult.data;

    // Generate unique slug
    let slug = slugify(title);
    let slugCounter = 1;
    while (await db.course.findUnique({ where: { slug } })) {
      slug = `${slugify(title)}-${slugCounter}`;
      slugCounter++;
    }

    // Create course (unpublished by default)
    const course = await db.course.create({
      data: {
        title,
        slug,
        description,
        level,
        skills,
        careerPaths: [careerPath],
        isPublished: false, // Admin must publish manually
        duration: 0, // Will be calculated from topics
      },
      include: {
        topics: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Course created successfully",
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        level: course.level,
        skills: course.skills,
        careerPaths: course.careerPaths,
        isPublished: course.isPublished,
        topicCount: course.topics.length,
      },
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to create course" 
      },
      { status: 500 }
    );
  }
}

