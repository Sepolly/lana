import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/waitlist
 * Get all waitlist entries, optionally filtered by career path
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const careerPath = searchParams.get("careerPath");

    const where = careerPath
      ? { careerPath: { contains: careerPath, mode: "insensitive" as const } }
      : {};

    const waitlist = await db.courseWaitlist.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by career path
    const groupedByCareer = waitlist.reduce(
      (acc, entry) => {
        if (!acc[entry.careerPath]) {
          acc[entry.careerPath] = [];
        }
        acc[entry.careerPath].push(entry);
        return acc;
      },
      {} as Record<string, typeof waitlist>
    );

    return NextResponse.json({
      success: true,
      waitlist,
      groupedByCareer,
      total: waitlist.length,
    });
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch waitlist",
      },
      { status: 500 }
    );
  }
}
