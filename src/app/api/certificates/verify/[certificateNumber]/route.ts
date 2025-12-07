import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ certificateNumber: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { certificateNumber } = await params;

    const certificate = await db.certificate.findUnique({
      where: { certificateNumber },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: "Certificate not found",
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        level: certificate.level,
        examScore: certificate.examScore,
        issueDate: certificate.issueDate,
        course: {
          title: certificate.course.title,
          slug: certificate.course.slug,
        },
        recipient: {
          name: certificate.user.name,
          email: certificate.user.email,
        },
        blockchainHash: certificate.blockchainHash,
      },
    });
  } catch (error) {
    console.error("Certificate verification error:", error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: "Failed to verify certificate",
      },
      { status: 500 }
    );
  }
}

