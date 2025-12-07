import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Exam configuration constants
const EXAM_PASSING_SCORE = 60; // 60% passing threshold

interface RouteParams {
  params: Promise<{ examId: string }>;
}

const submitSchema = z.object({
  answers: z.record(z.string(), z.number()),
});

// Submit exam answers
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

    const body = await request.json();
    const validationResult = submitSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { answers } = validationResult.data;

    const exam = await db.examSchedule.findUnique({
      where: { id: examId },
    });

    if (!exam || exam.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Exam not found" },
        { status: 404 }
      );
    }

    if (exam.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { success: false, error: "Exam is not in progress" },
        { status: 400 }
      );
    }

    // Calculate score
    const questions = exam.questions as Array<{
      id: string;
      question: string;
      options: string[];
      correctAnswer: number;
    }>;

    let correctCount = 0;
    const feedback: Array<{
      questionId: string;
      isCorrect: boolean;
      userAnswer: number;
      correctAnswer: number;
    }> = [];

    for (const question of questions) {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;

      feedback.push({
        questionId: question.id,
        isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer,
      });
    }

    const score = (correctCount / questions.length) * 100;
    const passed = score >= EXAM_PASSING_SCORE;

    // Update exam
    const updatedExam = await db.examSchedule.update({
      where: { id: examId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        answers,
        score,
        passed,
      },
    });

    // If passed, generate certificate
    let certificate = null;
    if (passed) {
      // Determine certificate level based on score
      let level: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" = "BRONZE";
      if (score >= 95) level = "PLATINUM";
      else if (score >= 85) level = "GOLD";
      else if (score >= 75) level = "SILVER";

      // Generate unique certificate number
      const certificateNumber = `LANA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      certificate = await db.certificate.create({
        data: {
          userId: session.user.id,
          courseId: exam.courseId,
          level,
          examScore: score,
          certificateNumber,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        exam: updatedExam,
        score,
        passed,
        correctCount,
        totalQuestions: questions.length,
        feedback,
        certificate,
      },
    });
  } catch (error) {
    console.error("Exam submit error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit exam" },
      { status: 500 }
    );
  }
}

