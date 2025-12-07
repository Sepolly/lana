import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/users
 * Get all users for admin listing
 */
export async function GET(request: NextRequest) {
  try {
    const users = await db.user.findMany({
      include: {
        profile: { select: { aptitudeCompleted: true } },
        _count: {
          select: {
            enrollments: true,
            certificates: true,
            jobApplications: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch users" 
      },
      { status: 500 }
    );
  }
}

