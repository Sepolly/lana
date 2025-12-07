import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ examId: string }>;
}

// Start an exam
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    if (exam.status !== "SCHEDULED") {
      return NextResponse.json(
        { success: false, error: "Exam has already started or completed" },
        { status: 400 }
      );
    }

    // Start the exam
    const updatedExam = await db.examSchedule.update({
      where: { id: examId },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    // Return questions without correct answers
    const questions = (updatedExam.questions as Array<{
      id: string;
      question: string;
      options: string[];
      correctAnswer: number;
    }>).map(({ correctAnswer, ...q }) => q);

    return NextResponse.json({
      success: true,
      data: {
        ...updatedExam,
        questions,
        endTime: new Date(Date.now() + updatedExam.duration * 60 * 1000),
      },
    });
  } catch (error) {
    console.error("Exam start error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to start exam" },
      { status: 500 }
    );
  }
}

