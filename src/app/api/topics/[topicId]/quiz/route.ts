import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ topicId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { topicId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get the quiz for this topic
    const quiz = await db.quiz.findFirst({
      where: { topicId },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({
        success: true,
        quiz: null,
      });
    }

    return NextResponse.json({
      success: true,
      quiz,
    });
  } catch (error) {
    console.error("Quiz fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch quiz" }, { status: 500 });
  }
}
