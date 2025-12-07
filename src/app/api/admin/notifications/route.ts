import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/notifications
 * Get all admin notifications
 */
export async function GET(request: NextRequest) {
  try {
    const notifications = await db.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to 50 most recent
    });

    const unreadCount = await db.adminNotification.count({
      where: { read: false },
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch notifications",
      },
      { status: 500 }
    );
  }
}
