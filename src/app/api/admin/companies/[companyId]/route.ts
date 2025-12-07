import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ companyId: string }>;
}

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  website: z.string().url().nullable().optional().or(z.literal("")),
  industry: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  logo: z.string().url().nullable().optional().or(z.literal("")),
  isPartner: z.boolean().optional(),
});

/**
 * GET /api/admin/companies/[companyId]
 * Get company details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { companyId } = await params;

    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      company,
    });
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch company" 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/companies/[companyId]
 * Update company
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { companyId } = await params;
    const body = await request.json();
    const validationResult = updateCompanySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid company data",
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    // Verify company exists
    const existingCompany = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    const updateData: {
      name?: string;
      slug?: string;
      description?: string | null;
      website?: string | null;
      industry?: string | null;
      location?: string | null;
      logo?: string | null;
      isPartner?: boolean;
    } = {};

    if (validationResult.data.name) {
      updateData.name = validationResult.data.name;
      // Update slug if name changes
      const newSlug = slugify(validationResult.data.name);
      const slugExists = await db.company.findFirst({
        where: {
          slug: newSlug,
          NOT: { id: companyId },
        },
      });
      
      if (slugExists) {
        let finalSlug = newSlug;
        let counter = 1;
        while (await db.company.findFirst({
          where: { slug: finalSlug, NOT: { id: companyId } },
        })) {
          finalSlug = `${newSlug}-${counter}`;
          counter++;
        }
        updateData.slug = finalSlug;
      } else {
        updateData.slug = newSlug;
      }
    }

    if (validationResult.data.description !== undefined) {
      updateData.description = validationResult.data.description;
    }
    if (validationResult.data.website !== undefined) {
      updateData.website = validationResult.data.website || null;
    }
    if (validationResult.data.industry !== undefined) {
      updateData.industry = validationResult.data.industry;
    }
    if (validationResult.data.location !== undefined) {
      updateData.location = validationResult.data.location;
    }
    if (validationResult.data.logo !== undefined) {
      updateData.logo = validationResult.data.logo || null;
    }
    if (validationResult.data.isPartner !== undefined) {
      updateData.isPartner = validationResult.data.isPartner;
    }

    // Update company
    const updatedCompany = await db.company.update({
      where: { id: companyId },
      data: updateData,
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Company updated successfully",
      company: updatedCompany,
    });
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update company" 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/companies/[companyId]
 * Delete a company
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { companyId } = await params;

    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    // Check if company has jobs
    if (company._count.jobs > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot delete company with existing jobs. Please delete or reassign jobs first." 
        },
        { status: 400 }
      );
    }

    // Delete company
    await db.company.delete({
      where: { id: companyId },
    });

    return NextResponse.json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to delete company" 
      },
      { status: 500 }
    );
  }
}

