import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateRecommendations } from "@/lib/recommendations";

// Get current recommendations
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        recommendedCareers: true,
        recommendedCourses: true,
        aptitudeCompleted: true,
      },
    });

    if (!profile?.aptitudeCompleted) {
      return NextResponse.json({
        success: false,
        error: "Please complete the aptitude test first",
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        careers: profile.recommendedCareers || [],
        courses: profile.recommendedCourses || [],
      },
    });
  } catch (error) {
    console.error("Recommendations fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}

// Regenerate recommendations
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await db.studentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile?.aptitudeCompleted) {
      return NextResponse.json({
        success: false,
        error: "Please complete the aptitude test first",
      }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const userType = (body.userType === "Employer" ? "Employer" : "Employed") as "Employed" | "Employer";

    // Regenerate recommendations based on current profile
    const recommendations = await generateRecommendations(
      {
        learningStyle: profile.learningStyle,
        interests: profile.interests || [],
        strengths: profile.strengths || [],
      },
      userType
    );

    // Update profile with new recommendations
    await db.studentProfile.update({
      where: { userId: session.user.id },
      data: {
        recommendedCareers: JSON.parse(JSON.stringify(recommendations.careers)),
        recommendedCourses: JSON.parse(JSON.stringify(recommendations.courses)),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Recommendations regenerated successfully",
      data: recommendations,
    });
  } catch (error) {
    console.error("Recommendations regeneration error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to regenerate recommendations" },
      { status: 500 }
    );
  }
}

