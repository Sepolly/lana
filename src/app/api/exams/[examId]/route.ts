import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ examId: string }>;
}

const isDevelopment = process.env.NODE_ENV === "development";

const saveAnswersSchema = z.object({
  answers: z.record(z.string(), z.number()),
});

// Get exam details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { examId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const exam = await db.examSchedule.findUnique({
      where: { id: examId },
    });

    if (!exam || exam.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
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
    if (isDevelopment) {
      console.error("Exam fetch error:", error);
    }
    return NextResponse.json({ success: false, error: "Failed to fetch exam" }, { status: 500 });
  }
}

// Save exam answers (auto-save during exam)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { examId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = saveAnswersSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { answers } = validationResult.data;

    const exam = await db.examSchedule.findUnique({
      where: { id: examId },
    });

    if (!exam || exam.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
    }

    if (exam.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { success: false, error: "Exam is not in progress" },
        { status: 400 }
      );
    }

    // Update exam with saved answers (don't change status or other fields)
    await db.examSchedule.update({
      where: { id: examId },
      data: {
        answers,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Answers saved successfully",
    });
  } catch (error) {
    if (isDevelopment) {
      console.error("Exam save answers error:", error);
    }
    return NextResponse.json({ success: false, error: "Failed to save answers" }, { status: 500 });
  }
}
