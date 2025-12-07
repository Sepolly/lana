import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ examId: string }>;
}

// Generate certificate for a passed exam
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { examId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get the exam
    const exam = await db.examSchedule.findUnique({
      where: { id: examId },
      include: {
        course: true,
      },
    });

    if (!exam || exam.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
    }

    // Check if exam was passed
    if (exam.status !== "COMPLETED" || !exam.passed || !exam.score) {
      return NextResponse.json(
        { success: false, error: "Certificate can only be generated for passed exams" },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    const existingCertificate = await db.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: exam.courseId,
        },
      },
    });

    if (existingCertificate) {
      return NextResponse.json(
        { success: false, error: "Certificate already exists for this course" },
        { status: 400 }
      );
    }

    // Determine certificate level based on score
    const score = exam.score;
    let level: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" = "BRONZE";
    if (score >= 95) level = "PLATINUM";
    else if (score >= 85) level = "GOLD";
    else if (score >= 75) level = "SILVER";

    // Generate unique certificate number
    const certificateNumber = `LANA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create certificate
    const certificate = await db.certificate.create({
      data: {
        userId: session.user.id,
        courseId: exam.courseId,
        level,
        examScore: score,
        certificateNumber,
      },
    });

    return NextResponse.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
