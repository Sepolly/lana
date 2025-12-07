import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CourseContent } from "./course-content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  try {
    const course = await db.course.findUnique({
      where: { slug },
      include: {
        topics: {
          orderBy: { order: "asc" },
          include: {
            quiz: {
              include: {
                questions: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      notFound();
    }

    // Validate and clean quiz question options (JSON fields)
    const cleanedCourse = {
      ...course,
      topics: course.topics.map((topic) => ({
        ...topic,
        quiz: topic.quiz
          ? {
              ...topic.quiz,
              questions: topic.quiz.questions.map((question) => {
                // Validate options JSON field
                let options = question.options;
                if (typeof options === 'string') {
                  try {
                    options = JSON.parse(options);
                  } catch (e) {
                    console.error(`Invalid JSON in quiz question ${question.id} options:`, e);
                    options = [];
                  }
                }
                // Ensure options is an array
                if (!Array.isArray(options)) {
                  console.error(`Quiz question ${question.id} options is not an array:`, options);
                  options = [];
                }
                return {
                  ...question,
                  options,
                };
              }),
            }
          : null,
      })),
    };

    // Get or create enrollment
    let enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
      include: {
        topicProgress: true,
      },
    });

    // Get user's profile for learning style
    const profile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
    });

    return (
      <CourseContent
        course={cleanedCourse}
        enrollment={enrollment}
        userId={session.user.id}
        learningStyle={profile?.learningStyle || null}
      />
    );
  } catch (error) {
    console.error("Error loading course:", error);
    // Return a more user-friendly error
    throw new Error("Failed to load course. Please try again later.");
  }
}

