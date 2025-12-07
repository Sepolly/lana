import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

const applicationSchema = z.object({
  coverLetter: z.string().optional(),
  resumeUrl: z.string().optional(),
});

// Apply for a job
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { jobId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = applicationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    const { coverLetter, resumeUrl } = validationResult.data;

    // Check if job exists and is active
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job || !job.isActive) {
      return NextResponse.json(
        { success: false, error: "Job not found or no longer active" },
        { status: 404 }
      );
    }

    // Check if already applied
    const existingApplication = await db.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: "You have already applied for this job" },
        { status: 400 }
      );
    }

    // Check if user has certificates (eligibility)
    const certificates = await db.certificate.findMany({
      where: { userId: session.user.id },
      include: { course: true },
    });

    if (certificates.length === 0) {
      return NextResponse.json(
        { success: false, error: "You need at least one certificate to apply for jobs" },
        { status: 403 }
      );
    }

    // Create application
    const application = await db.jobApplication.create({
      data: {
        userId: session.user.id,
        jobId,
        coverLetter,
        resumeUrl,
        status: "PENDING",
      },
      include: {
        job: {
          include: { company: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Job application error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit application" },
      { status: 500 }
    );
  }
}

// Get application status for a job
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { jobId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const application = await db.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Application fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

