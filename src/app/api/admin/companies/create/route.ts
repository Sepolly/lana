import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  website: z.string().url().nullable().optional().or(z.literal("")),
  industry: z.string().optional(),
  location: z.string().optional(),
  logo: z.string().url().nullable().optional().or(z.literal("")),
  isPartner: z.boolean().default(false),
});

/**
 * POST /api/admin/companies/create
 * Create a new company
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createCompanySchema.safeParse(body);

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

    const data = validationResult.data;

    // Generate unique slug
    let slug = slugify(data.name);
    let slugCounter = 1;
    while (await db.company.findUnique({ where: { slug } })) {
      slug = `${slugify(data.name)}-${slugCounter}`;
      slugCounter++;
    }

    // Create company
    const company = await db.company.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        website: data.website || null,
        industry: data.industry || null,
        location: data.location || null,
        logo: data.logo || null,
        isPartner: data.isPartner,
      },
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
      message: "Company created successfully",
      company,
    });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to create company" 
      },
      { status: 500 }
    );
  }
}

