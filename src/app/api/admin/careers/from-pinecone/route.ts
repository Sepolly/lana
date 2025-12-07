import { NextRequest, NextResponse } from "next/server";
import { querySimilar } from "@/lib/pinecone";
import { generateEmbedding } from "@/lib/openrouter";

/**
 * GET /api/admin/careers/from-pinecone
 * Query Pinecone for careers (userType: "Employed")
 * Returns list of careers that admin can create courses for
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    // If query provided, search by embedding similarity
    // Otherwise, get all careers
    let results;

    if (query.trim()) {
      // Generate embedding for search query
      const queryVector = await generateEmbedding(query);

      // Query Pinecone for similar careers
      results = await querySimilar(queryVector, limit, undefined, { userType: "Employed" });
    } else {
      // Get all careers by querying with a generic embedding
      const genericQuery = "career job profession employment";
      const queryVector = await generateEmbedding(genericQuery);

      results = await querySimilar(queryVector, limit, undefined, { userType: "Employed" });
    }

    // Extract unique careers from results
    const careersMap = new Map<
      string,
      {
        field: string;
        skills: string[];
        id: string;
        score: number;
      }
    >();

    results.forEach((result) => {
      const field = (result.metadata?.field as string)?.trim();
      if (!field) return;

      const skillsRaw = result.metadata?.skills as string | string[] | undefined;
      let skills: string[] = [];
      if (typeof skillsRaw === "string") {
        skills = skillsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (Array.isArray(skillsRaw)) {
        skills = skillsRaw;
      }

      // Use field as key to avoid duplicates
      if (!careersMap.has(field)) {
        careersMap.set(field, {
          field,
          skills,
          id: result.id,
          score: result.score,
        });
      }
    });

    const careers = Array.from(careersMap.values())
      .sort((a, b) => b.score - a.score)
      .map((career) => ({
        id: career.id,
        title: career.field,
        skills: career.skills,
        matchScore: Math.round(career.score * 100),
      }));

    return NextResponse.json({
      success: true,
      careers,
      total: careers.length,
    });
  } catch (error) {
    console.error("Error fetching careers from Pinecone:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch careers",
      },
      { status: 500 }
    );
  }
}
