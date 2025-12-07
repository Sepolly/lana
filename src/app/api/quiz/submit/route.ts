import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const submitSchema = z.object({
  quizId: z.string(),
  topicId: z.string(),
  enrollmentId: z.string(),
  answers: z.record(z.string(), z.number()),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = submitSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 });
    }

    const { quizId, topicId, enrollmentId, answers } = validationResult.data;

    // Verify enrollment belongs to user
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment || enrollment.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Invalid enrollment" }, { status: 403 });
    }

    // Get quiz with questions
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    // Calculate score
    let correctCount = 0;
    const feedback: Array<{
      questionId: string;
      isCorrect: boolean;
      correctAnswer: number;
      userAnswer: number;
    }> = [];

    for (const question of quiz.questions) {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;

      if (isCorrect) {
        correctCount++;
      }

      feedback.push({
        questionId: question.id,
        isCorrect,
        correctAnswer: question.correctAnswer,
        userAnswer: userAnswer ?? -1,
      });
    }

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    // Create quiz attempt
    await db.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId,
        answers,
        score,
        passed,
        completedAt: new Date(),
      },
    });

    // If passed, update topic progress
    if (passed) {
      await db.topicProgress.upsert({
        where: {
          enrollmentId_topicId: {
            enrollmentId,
            topicId,
          },
        },
        update: {
          quizPassed: true,
          quizScore: score,
          isCompleted: true,
          completedAt: new Date(),
        },
        create: {
          enrollmentId,
          topicId,
          videoWatched: true,
          videoProgress: 100,
          quizPassed: true,
          quizScore: score,
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      // Update enrollment progress
      const allTopicProgress = await db.topicProgress.findMany({
        where: { enrollmentId },
      });

      const course = await db.course.findFirst({
        where: {
          topics: {
            some: { id: topicId },
          },
        },
        include: { _count: { select: { topics: true } } },
      });

      if (course) {
        const completedCount = allTopicProgress.filter((p) => p.isCompleted).length;
        const progress = (completedCount / course._count.topics) * 100;

        await db.enrollment.update({
          where: { id: enrollmentId },
          data: {
            progress,
            status: progress >= 100 ? "COMPLETED" : "ACTIVE",
            completedAt: progress >= 100 ? new Date() : null,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      score,
      passed,
      feedback,
      correctCount,
      totalQuestions: quiz.questions.length,
    });
  } catch (error) {
    console.error("Quiz submission error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit quiz" }, { status: 500 });
  }
}
