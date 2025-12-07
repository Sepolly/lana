import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateExamQuestions, GeneratedQuestion } from "@/lib/quiz-generator";

const isDevelopment = process.env.NODE_ENV === "development";

const scheduleSchema = z.object({
  courseId: z.string(),
  scheduledAt: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = scheduleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 });
    }

    const { courseId, scheduledAt } = validationResult.data;

    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "You must be enrolled in this course to schedule an exam" },
        { status: 400 }
      );
    }

    const courseData = await db.course.findUnique({
      where: { id: courseId },
      include: {
        topics: {
          select: { id: true },
        },
      },
    });

    if (!courseData) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const topicProgress = await db.topicProgress.findMany({
      where: {
        enrollmentId: enrollment.id,
        isCompleted: true,
      },
      select: { topicId: true },
    });

    const completedTopicIds = new Set(topicProgress.map((tp) => tp.topicId));
    const totalTopics = courseData.topics.length;
    const completedTopics = completedTopicIds.size;
    const actualProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    if (isDevelopment) {
      console.log("Exam scheduling attempt:", {
        userId: session.user.id,
        courseId,
        enrollmentProgress: enrollment.progress,
        actualProgress,
        totalTopics,
        completedTopics,
        completedTopicIds: Array.from(completedTopicIds),
      });
    }

    if (completedTopics < totalTopics) {
      return NextResponse.json(
        {
          success: false,
          error: `You must complete all topics and pass all quizzes before scheduling an exam. ${completedTopics}/${totalTopics} topics completed.`,
        },
        { status: 400 }
      );
    }

    const existingExam = await db.examSchedule.findFirst({
      where: {
        userId: session.user.id,
        courseId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
    });

    if (existingExam) {
      return NextResponse.json(
        { success: false, error: "You already have a scheduled or ongoing exam" },
        { status: 400 }
      );
    }

    const existingCourseExam = await db.examSchedule.findFirst({
      where: {
        courseId,
        questions: { not: null },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        questions: true,
        duration: true,
      },
    });

    let finalQuestions: GeneratedQuestion[] = [];
    let shouldGenerateNewQuestions = true;

    if (existingCourseExam?.questions) {
      try {
        const existingQuestions = existingCourseExam.questions as Array<{
          id: string;
          question: string;
          options: string[];
          correctAnswer: number;
          topicId?: string;
          topicTitle?: string;
        }>;

        if (Array.isArray(existingQuestions) && existingQuestions.length > 0) {
          if (isDevelopment) {
            console.log(
              `Reusing ${existingQuestions.length} questions from existing exam for course ${courseId}`
            );
          }

          finalQuestions = existingQuestions.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: "Based on the course material.",
          }));

          shouldGenerateNewQuestions = false;
        }
      } catch (error) {
        if (isDevelopment) {
          console.error("Error parsing existing exam questions, will generate new ones:", error);
        }
      }
    }

    if (shouldGenerateNewQuestions) {
      const course = await db.course.findUnique({
        where: { id: courseId },
        include: {
          topics: {
            include: {
              quiz: {
                include: {
                  questions: true,
                },
              },
            },
          },
        },
      });

      if (!course) {
        return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
      }

      const topicsForExam = course.topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        videoTranscript: topic.videoTranscript,
        textContent: topic.textContent,
        quiz: topic.quiz
          ? {
              questions: topic.quiz.questions.map((q) => ({
                question: q.question,
                options: q.options as string[],
                correctAnswer: q.correctAnswer,
              })),
            }
          : null,
      }));

      let generatedQuestions: GeneratedQuestion[] = [];
      let generationError: string | null = null;

      try {
        generatedQuestions = await generateExamQuestions(topicsForExam, course.title, 50);

        if (isDevelopment) {
          console.log("Exam generation:", {
            courseId,
            requestedMin: 50,
            topicsCount: topicsForExam.length,
            generatedCount: generatedQuestions.length,
          });
        }
      } catch (error: unknown) {
        if (isDevelopment) {
          console.error("Exam question generation failed:", error);
        }
        const errorObj = error instanceof Error ? error : new Error(String(error));
        generationError = errorObj.message || "Failed to generate exam questions";

        if (
          generationError &&
          (generationError.includes("API_RATE_LIMIT_EXCEEDED") ||
            generationError.includes("API_QUOTA_EXCEEDED") ||
            generationError.includes("429"))
        ) {
          if (isDevelopment) {
            console.warn(
              "API rate limit exceeded, will try to use existing exam questions or fallback"
            );
          }

          if (finalQuestions.length === 0 && existingCourseExam?.questions) {
            try {
              const existingQuestions = existingCourseExam.questions as Array<{
                id: string;
                question: string;
                options: string[];
                correctAnswer: number;
              }>;

              if (Array.isArray(existingQuestions) && existingQuestions.length > 0) {
                if (isDevelopment) {
                  console.log("Using existing exam questions as fallback due to rate limit");
                }
                finalQuestions = existingQuestions.map((q) => ({
                  question: q.question,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explanation: "Based on the course material.",
                }));
                shouldGenerateNewQuestions = false;
              }
            } catch (parseError) {
              if (isDevelopment) {
                console.error("Failed to parse existing questions:", parseError);
              }
            }
          }
        } else {
          throw error;
        }
      }

      const maxQuestions = 60;
      finalQuestions = generatedQuestions.slice(0, maxQuestions);

      if (finalQuestions.length === 0 && generationError) {
        if (isDevelopment) {
          console.log("Using fallback questions due to generation failure");
        }
        finalQuestions = createFallbackExamQuestions(course.title, Math.min(30, maxQuestions));
      }
    }

    const examQuestions = finalQuestions.map((q, index) => ({
      id: `exam-q-${index + 1}`,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      topicId: "",
      topicTitle: "",
    }));

    const calculateExamDuration = (questionCount: number): number => {
      const timePerQuestion = 1.0;
      const baseDuration = 15;
      const calculatedDuration = baseDuration + questionCount * timePerQuestion;
      const minDuration = 30;
      return Math.max(calculatedDuration, minDuration);
    };

    const duration = existingCourseExam?.duration
      ? existingCourseExam.duration
      : calculateExamDuration(examQuestions.length);

    const exam = await db.examSchedule.create({
      data: {
        userId: session.user.id,
        courseId,
        scheduledAt: new Date(scheduledAt),
        duration,
        questions: examQuestions,
        status: "SCHEDULED",
      },
    });

    return NextResponse.json({
      success: true,
      data: exam,
    });
  } catch (error) {
    if (isDevelopment) {
      console.error("Exam schedule error:", error);
    }
    return NextResponse.json({ success: false, error: "Failed to schedule exam" }, { status: 500 });
  }
}

function createFallbackExamQuestions(courseTitle: string, count: number): GeneratedQuestion[] {
  const fallbackQuestions: GeneratedQuestion[] = [
    {
      question: `What is the primary goal of studying ${courseTitle}?`,
      options: [
        "To memorize facts without understanding",
        "To develop practical skills and knowledge",
        "To complete course requirements only",
        "To focus solely on theoretical concepts",
      ],
      correctAnswer: 1,
      explanation: "The primary goal is to develop practical skills and deep understanding.",
    },
    {
      question: `Which approach is most effective for learning ${courseTitle}?`,
      options: [
        "Passive reading without practice",
        "Active learning with hands-on application",
        "Memorizing without comprehension",
        "Avoiding challenging concepts",
      ],
      correctAnswer: 1,
      explanation:
        "Active learning with practical application leads to better retention and understanding.",
    },
    {
      question: `What is essential for success in ${courseTitle}?`,
      options: [
        "Speed over accuracy",
        "Consistent practice and review",
        "Avoiding difficult problems",
        "Working in isolation",
      ],
      correctAnswer: 1,
      explanation: "Consistent practice and regular review are key to mastering the subject.",
    },
    {
      question: `How should you approach problem-solving in ${courseTitle}?`,
      options: [
        "Give up when facing difficulties",
        "Apply logical reasoning and learned concepts",
        "Guess randomly without analysis",
        "Avoid complex problems",
      ],
      correctAnswer: 1,
      explanation:
        "Problem-solving requires logical reasoning and application of learned concepts.",
    },
    {
      question: `What is the benefit of understanding foundational concepts in ${courseTitle}?`,
      options: [
        "It limits your ability to learn advanced topics",
        "It provides a strong base for advanced learning",
        "It makes the subject more confusing",
        "It reduces the need for practice",
      ],
      correctAnswer: 1,
      explanation:
        "Strong foundational knowledge enables better understanding of advanced concepts.",
    },
    {
      question: `Which learning method is most valuable for ${courseTitle}?`,
      options: [
        "Rote memorization only",
        "Understanding principles and their application",
        "Avoiding practical exercises",
        "Focusing only on easy topics",
      ],
      correctAnswer: 1,
      explanation:
        "Understanding principles and their practical application is essential for mastery.",
    },
    {
      question: `What should you do when you encounter a challenging concept in ${courseTitle}?`,
      options: [
        "Skip it and move on",
        "Break it down and seek additional resources",
        "Give up on the topic",
        "Memorize without understanding",
      ],
      correctAnswer: 1,
      explanation:
        "Breaking down challenging concepts and seeking additional resources helps overcome difficulties.",
    },
    {
      question: `Why is regular review important in ${courseTitle}?`,
      options: [
        "It prevents forgetting learned material",
        "It wastes valuable time",
        "It makes concepts more confusing",
        "It reduces the need for practice",
      ],
      correctAnswer: 0,
      explanation: "Regular review helps reinforce learning and prevents forgetting.",
    },
    {
      question: `What role does critical thinking play in ${courseTitle}?`,
      options: [
        "It is not important for this subject",
        "It helps analyze and evaluate information",
        "It makes learning more difficult",
        "It should be avoided",
      ],
      correctAnswer: 1,
      explanation:
        "Critical thinking is essential for analyzing and evaluating concepts in the subject.",
    },
    {
      question: `How can you improve your performance in ${courseTitle}?`,
      options: [
        "Avoid seeking help when needed",
        "Practice regularly and ask questions",
        "Work only when motivated",
        "Focus only on areas you already know",
      ],
      correctAnswer: 1,
      explanation: "Regular practice and seeking help when needed leads to continuous improvement.",
    },
  ];

  const result: GeneratedQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const question = fallbackQuestions[i % fallbackQuestions.length];
    result.push({
      ...question,
      question: question.question.replace("${courseTitle}", courseTitle),
    });
  }

  return result;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const exams = await db.examSchedule.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        scheduledAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: exams,
    });
  } catch (error) {
    if (isDevelopment) {
      console.error("Exam fetch error:", error);
    }
    return NextResponse.json({ success: false, error: "Failed to fetch exams" }, { status: 500 });
  }
}
