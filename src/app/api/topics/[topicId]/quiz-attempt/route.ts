import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ topicId: string }>;
}

/**
 * GET /api/topics/[topicId]/quiz-attempt
 * Get the latest quiz attempt for the current user for this topic
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { topicId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get the topic's quiz
    const topic = await db.topic.findUnique({
      where: { id: topicId },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!topic || !topic.quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    // Get the latest quiz attempt for this user
    const attempt = await db.quizAttempt.findFirst({
      where: {
        userId: session.user.id,
        quizId: topic.quiz.id,
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    if (!attempt) {
      return NextResponse.json({ success: false, error: "No quiz attempt found" }, { status: 404 });
    }

    // Get topic progress to check completion status
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: topic.courseId,
      },
    });

    const topicProgress = enrollment
      ? await db.topicProgress.findUnique({
          where: {
            enrollmentId_topicId: {
              enrollmentId: enrollment.id,
              topicId: topic.id,
            },
          },
        })
      : null;

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        score: attempt.score,
        passed: attempt.passed,
        answers: attempt.answers,
        completedAt: attempt.completedAt,
      },
      quiz: {
        id: topic.quiz.id,
        title: topic.quiz.title,
        passingScore: topic.quiz.passingScore,
        questions: topic.quiz.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          order: q.order,
        })),
      },
      isCompleted: topicProgress?.isCompleted || false,
    });
  } catch (error) {
    console.error("Quiz attempt fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch quiz attempt" },
      { status: 500 }
    );
  }
}
