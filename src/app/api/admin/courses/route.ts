import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/courses
 * Get all courses for admin listing
 */
export async function GET(request: NextRequest) {
  try {
    const courses = await db.course.findMany({
      include: {
        topics: { select: { id: true } },
        _count: {
          select: {
            enrollments: true,
            certificates: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch courses",
      },
      { status: 500 }
    );
  }
}
