import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/jobs
 * Get all jobs for admin listing
 */
export async function GET(request: NextRequest) {
  try {
    const jobs = await db.job.findMany({
      include: {
        company: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch jobs" 
      },
      { status: 500 }
    );
  }
}

