import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ examId: string }>;
}

// Get exam details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { examId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const exam = await db.examSchedule.findUnique({
      where: { id: examId },
    });

    if (!exam || exam.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }

    // Remove correct answers if exam is still ongoing
    let questions = exam.questions as Array<{
      id: string;
      question: string;
      options: string[];
      correctAnswer?: number;
    }>;

    if (exam.status !== "COMPLETED") {
      questions = questions.map(({ correctAnswer, ...q }) => q);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...exam,
        questions,
      },
    });
  } catch (error) {
    console.error("Exam fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exam" },
      { status: 500 }
    );
  }
}

