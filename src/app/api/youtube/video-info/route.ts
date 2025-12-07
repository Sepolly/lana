import { NextRequest, NextResponse } from "next/server";
import { extractVideoId } from "@/lib/video-transcript";
import { YoutubeTranscript } from "youtube-transcript";
import { chatCompletion, type Message } from "@/lib/openrouter";

/**
 * POST /api/youtube/video-info
 * Get YouTube video duration and transcript using Google Gemini
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: "Video URL is required" },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Get video duration from YouTube API
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "YouTube API key not configured" },
        { status: 500 }
      );
    }

    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=contentDetails`
    );

    if (!detailsResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch video details from YouTube" },
        { status: 500 }
      );
    }

    const detailsData = await detailsResponse.json();
    if (!detailsData.items || detailsData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Video not found" },
        { status: 404 }
      );
    }

    // Parse ISO 8601 duration (e.g., PT1H2M10S)
    const durationISO = detailsData.items[0].contentDetails.duration;
    const durationSeconds = parseDuration(durationISO);
    const durationMinutes = Math.ceil(durationSeconds / 60);

    // Get transcript using YouTube transcript API first
    let rawTranscript: string | null = null;
    try {
      const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
      if (transcriptData && transcriptData.length > 0) {
        rawTranscript = transcriptData
          .map((segment) => segment.text)
          .join(" ")
          .replace(/\s+/g, " ")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .trim();
      }
    } catch (error) {
      console.log("YouTube transcript not available, will use Gemini:", error);
    }

    // Use Google Gemini to generate full text transcript
    let transcript: string | null = null;
    if (rawTranscript) {
      try {
        // Use Gemini to clean up and enhance the transcript
        const prompt = `You are a professional transcription editor. I have a raw transcript from a YouTube video. Please:
1. Clean up the transcript by fixing any transcription errors
2. Add proper punctuation and capitalization
3. Organize it into clear, readable paragraphs
4. Maintain all the original content and meaning
5. Make it flow naturally as if it were written text

Raw transcript:
${rawTranscript.substring(0, 10000)}${rawTranscript.length > 10000 ? "\n[... transcript continues ...]" : ""}

Return ONLY the cleaned, formatted transcript text. Do not add any explanations or additional text.`;

        const messages: Message[] = [
          {
            role: "system",
            content: "You are a professional transcription editor. Clean and format transcripts to be readable and well-structured. Return only the cleaned transcript text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ];

        transcript = await chatCompletion(messages, {
          model: "google/gemini-2.0-flash-exp:free", // Use Google Gemini model
          temperature: 0.3,
          maxTokens: 8000,
        });

        // If Gemini response is too short or seems like an error, use raw transcript
        if (!transcript || transcript.length < rawTranscript.length * 0.5) {
          console.log("Gemini transcript seems incomplete, using raw transcript");
          transcript = rawTranscript;
        }
      } catch (error) {
        console.error("Error generating transcript with Gemini:", error);
        // Fallback to raw transcript if Gemini fails
        transcript = rawTranscript;
      }
    } else {
      // If no YouTube transcript available, try to use Gemini to generate from video metadata
      // This is a fallback - Gemini can't actually watch videos, but we can try
      console.log("No YouTube transcript available, cannot generate with Gemini without transcript data");
    }

    return NextResponse.json({
      success: true,
      data: {
        duration: durationMinutes,
        transcript: transcript,
        hasTranscript: !!transcript,
      },
    });
  } catch (error) {
    console.error("Error fetching YouTube video info:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch video information",
      },
      { status: 500 }
    );
  }
}

/**
 * Parse ISO 8601 duration to seconds
 * Examples: PT1H2M10S = 3730 seconds, PT15M30S = 930 seconds
 */
function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

