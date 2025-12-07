import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const createJobSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requirements: z.string().optional(),
  location: z.string().optional(),
  jobType: z.string().optional(),
  salaryRange: z.string().optional(),
  requiredSkills: z.array(z.string()).default([]),
  requiredCourses: z.array(z.string()).default([]),
  isDirectPlacement: z.boolean().default(false),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().nullable().optional(),
});

/**
 * POST /api/admin/jobs/create
 * Create a new job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createJobSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid job data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: validationResult.data.companyId },
    });

    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    const data = validationResult.data;

    // Generate unique slug
    let slug = slugify(data.title);
    let slugCounter = 1;
    while (await db.job.findUnique({ where: { slug } })) {
      slug = `${slugify(data.title)}-${slugCounter}`;
      slugCounter++;
    }

    // Create job
    const job = await db.job.create({
      data: {
        companyId: data.companyId,
        title: data.title,
        slug,
        description: data.description,
        requirements: data.requirements || null,
        location: data.location || null,
        jobType: data.jobType || null,
        salaryRange: data.salaryRange || null,
        requiredSkills: data.requiredSkills,
        requiredCourses: data.requiredCourses,
        isDirectPlacement: data.isDirectPlacement,
        isActive: data.isActive,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
      include: {
        company: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create job",
      },
      { status: 500 }
    );
  }
}
