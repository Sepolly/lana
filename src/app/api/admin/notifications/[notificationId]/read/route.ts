import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ notificationId: string }>;
}

/**
 * POST /api/admin/notifications/[notificationId]/read
 * Mark a notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { notificationId } = await params;

    const notification = await db.adminNotification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to mark notification as read",
      },
      { status: 500 }
    );
  }
}

