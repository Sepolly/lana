import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateVideoTranscript } from "@/lib/video-transcript";

interface RouteParams {
  params: Promise<{ topicId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { topicId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { videoUrl, topicTitle, topicDescription } = body;

    if (!videoUrl || !topicTitle) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if topic exists and user is enrolled
    const topic = await db.topic.findUnique({
      where: { id: topicId },
      include: {
        course: {
          select: { id: true },
        },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { success: false, error: "Topic not found" },
        { status: 404 }
      );
    }

    // Check if we already have a transcript saved
    if (topic.textContent && topic.textContent.length > 500) {
      // Return cached transcript
      return NextResponse.json({
        success: true,
        transcript: {
          transcript: topic.textContent,
          summary: `This lesson covers ${topicTitle}.`,
          keyPoints: [
            "Core concepts and fundamentals",
            "Practical techniques",
            "Real-world applications",
          ],
          duration: `${topic.duration} minutes`,
        },
        cached: true,
      });
    }

    // Verify enrollment
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: topic.course.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Generate transcript using AI
    console.log(`Generating transcript for topic: ${topicTitle}`);
    const transcript = await generateVideoTranscript(videoUrl, topicTitle, topicDescription);

    // Save transcript to topic
    await db.topic.update({
      where: { id: topicId },
      data: {
        textContent: transcript.transcript,
      },
    });

    return NextResponse.json({
      success: true,
      transcript,
      cached: false,
    });
  } catch (error) {
    console.error("Transcript generation error:", error);
    
    // Check if it's a "no transcript available" error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isNoTranscriptError = errorMessage.includes("No transcript available") || 
                                 errorMessage.includes("Could not get") ||
                                 errorMessage.includes("Transcript is disabled");
    
    return NextResponse.json(
      { 
        success: false, 
        error: isNoTranscriptError 
          ? "This video does not have captions/transcript available on YouTube"
          : "Failed to fetch transcript from YouTube",
        details: errorMessage,
      },
      { status: isNoTranscriptError ? 404 : 500 }
    );
  }
}

// GET existing transcript
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { topicId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const topic = await db.topic.findUnique({
      where: { id: topicId },
      select: {
        id: true,
        title: true,
        textContent: true,
        duration: true,
      },
    });

    if (!topic) {
      return NextResponse.json(
        { success: false, error: "Topic not found" },
        { status: 404 }
      );
    }

    if (!topic.textContent) {
      return NextResponse.json({
        success: true,
        transcript: null,
      });
    }

    return NextResponse.json({
      success: true,
      transcript: {
        transcript: topic.textContent,
        summary: `This lesson covers ${topic.title}.`,
        keyPoints: [],
        duration: `${topic.duration} minutes`,
      },
    });
  } catch (error) {
    console.error("Transcript fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}

