import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

const updateJobSchema = z.object({
  companyId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  requirements: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  jobType: z.string().nullable().optional(),
  salaryRange: z.string().nullable().optional(),
  requiredSkills: z.array(z.string()).optional(),
  requiredCourses: z.array(z.string()).optional(),
  isDirectPlacement: z.boolean().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

/**
 * GET /api/admin/jobs/[jobId]
 * Get job details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { jobId } = await params;

    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch job" 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/jobs/[jobId]
 * Update job
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const validationResult = updateJobSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid job data",
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    // Verify job exists
    const existingJob = await db.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    const updateData: {
      companyId?: string;
      title?: string;
      slug?: string;
      description?: string;
      requirements?: string | null;
      location?: string | null;
      jobType?: string | null;
      salaryRange?: string | null;
      requiredSkills?: string[];
      requiredCourses?: string[];
      isDirectPlacement?: boolean;
      isActive?: boolean;
      expiresAt?: Date | null;
    } = {};

    if (validationResult.data.title) {
      updateData.title = validationResult.data.title;
      // Update slug if title changes
      const newSlug = slugify(validationResult.data.title);
      const slugExists = await db.job.findFirst({
        where: {
          slug: newSlug,
          NOT: { id: jobId },
        },
      });
      
      if (slugExists) {
        let finalSlug = newSlug;
        let counter = 1;
        while (await db.job.findFirst({
          where: { slug: finalSlug, NOT: { id: jobId } },
        })) {
          finalSlug = `${newSlug}-${counter}`;
          counter++;
        }
        updateData.slug = finalSlug;
      } else {
        updateData.slug = newSlug;
      }
    }

    if (validationResult.data.companyId) {
      // Verify company exists
      const company = await db.company.findUnique({
        where: { id: validationResult.data.companyId },
      });
      if (!company) {
        return NextResponse.json(
          { success: false, error: "Company not found" },
          { status: 404 }
        );
      }
      updateData.companyId = validationResult.data.companyId;
    }

    if (validationResult.data.description !== undefined) {
      updateData.description = validationResult.data.description;
    }
    if (validationResult.data.requirements !== undefined) {
      updateData.requirements = validationResult.data.requirements;
    }
    if (validationResult.data.location !== undefined) {
      updateData.location = validationResult.data.location;
    }
    if (validationResult.data.jobType !== undefined) {
      updateData.jobType = validationResult.data.jobType;
    }
    if (validationResult.data.salaryRange !== undefined) {
      updateData.salaryRange = validationResult.data.salaryRange;
    }
    if (validationResult.data.requiredSkills !== undefined) {
      updateData.requiredSkills = validationResult.data.requiredSkills;
    }
    if (validationResult.data.requiredCourses !== undefined) {
      updateData.requiredCourses = validationResult.data.requiredCourses;
    }
    if (validationResult.data.isDirectPlacement !== undefined) {
      updateData.isDirectPlacement = validationResult.data.isDirectPlacement;
    }
    if (validationResult.data.isActive !== undefined) {
      updateData.isActive = validationResult.data.isActive;
    }
    if (validationResult.data.expiresAt !== undefined) {
      updateData.expiresAt = validationResult.data.expiresAt ? new Date(validationResult.data.expiresAt) : null;
    }

    // Update job
    const updatedJob = await db.job.update({
      where: { id: jobId },
      data: updateData,
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
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update job" 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/jobs/[jobId]
 * Delete a job
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { jobId } = await params;

    // Verify job exists
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Check if job has applications
    if (job._count.applications > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot delete job with existing applications. Please deactivate the job instead." 
        },
        { status: 400 }
      );
    }

    // Delete job (cascade will handle related data)
    await db.job.delete({
      where: { id: jobId },
    });

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to delete job" 
      },
      { status: 500 }
    );
  }
}

