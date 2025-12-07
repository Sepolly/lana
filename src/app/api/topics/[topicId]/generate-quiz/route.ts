import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateQuizFromTranscript, calculateQuestionCount } from "@/lib/quiz-generator";

interface RouteParams {
  params: Promise<{ topicId: string }>;
}

/**
 * POST /api/topics/[topicId]/generate-quiz
 * Generate quiz questions STRICTLY from the topic's notes (textContent)
 * - Uses AI (Google Gemini via generateQuizFromTranscript)
 * - No YouTube transcript or topic-description fallbacks
 * - If notes are missing or too short, returns an error
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { topicId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the topic with course info
    const topic = await db.topic.findUnique({
      where: { id: topicId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            careerPaths: true,
          },
        },
        quiz: {
          select: { id: true },
        },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { success: false, error: "Topic not found" },
        { status: 404 }
      );
    }

    // Check if quiz already exists
    if (topic.quiz) {
      return NextResponse.json({
        success: true,
        message: "Quiz already exists",
        quizId: topic.quiz.id,
      });
    }

    // Verify user is enrolled in this course
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: topic.course.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Enforce notes-based quiz generation
    // We require meaningful notes/textContent to generate a quiz.
    if (!topic.textContent || topic.textContent.trim().length < 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Topic notes are missing or too short to generate a quiz. Please ensure the topic has detailed notes before generating a quiz.",
          requiresNotes: true,
        },
        { status: 400 }
      );
    }

    console.log(`[Quiz Gen] Using topic notes (textContent) for quiz: ${topic.title}`);

    // Prepare transcript from notes (clamped length for token limits)
    const preparedTranscript =
      topic.textContent.length > 10000
        ? topic.textContent.substring(0, 10000)
        : topic.textContent;

    // Calculate dynamic question count based on content length (up to 10 questions)
    const questionCount = calculateQuestionCount(topic.textContent);
    console.log(`[Quiz Gen] Generating ${questionCount} questions based on content length (${topic.textContent.length} chars)`);

    // Use AI (Gemini via generateQuizFromTranscript) to create quiz from notes
    // Pass undefined to let the function calculate dynamically, or pass the calculated count
    const quizData = await generateQuizFromTranscript(
      topic.title,
      preparedTranscript,
      questionCount
    );

    console.log(`[Quiz Gen] Generated ${quizData.questions.length} questions from topic notes`);

    // Save quiz to database
    const quiz = await db.quiz.create({
      data: {
        topicId: topic.id,
        title: `${topic.title} Quiz`,
        passingScore: quizData.passingScore,
        questions: {
          create: quizData.questions.map((q, index) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            order: index + 1,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Quiz generated successfully from topic notes",
      quiz: {
        id: quiz.id,
        title: quiz.title,
        questionCount: quiz.questions.length,
        passingScore: quiz.passingScore,
      },
      source: "notes",
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
