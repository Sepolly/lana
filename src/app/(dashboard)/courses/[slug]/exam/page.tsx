import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ExamInterface } from "./exam-interface";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ExamPage({ params }: PageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      topics: {
        select: { id: true },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // Check enrollment and completion
  const enrollment = await db.enrollment.findUnique({
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

  if (!enrollment) {
    redirect(`/courses/${slug}`);
  }

  // Check if all topics are completed
  const completedTopics = enrollment.topicProgress.filter((p) => p.isCompleted).length;
  const allCompleted = completedTopics === course.topics.length;

  if (!allCompleted) {
    redirect(`/courses/${slug}`);
  }

  // Check for existing exam (only fetch non-completed exams to allow retakes)
  const existingExam = await db.examSchedule.findFirst({
    where: {
      userId: session.user.id,
      courseId: course.id,
      status: { in: ["SCHEDULED", "IN_PROGRESS"] }, // Don't fetch completed exams
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log('Exam page debug:', {
    userId: session.user.id,
    courseId: course.id,
    hasExistingExam: !!existingExam,
    existingExamStatus: existingExam?.status,
    existingExamId: existingExam?.id,
    existingExamCreatedAt: existingExam?.createdAt
  });

  // Check for existing certificate
  const certificate = await db.certificate.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: course.id,
      },
    },
  });

  return (
    <ExamInterface
      course={course}
      existingExam={existingExam}
      certificate={certificate}
      userId={session.user.id}
    />
  );
}

