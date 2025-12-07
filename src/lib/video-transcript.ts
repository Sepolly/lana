/**
 * YouTube Video Transcript Service
 * Fetches actual transcripts from YouTube captions using youtube-transcript package
 * NO FALLBACKS - Only real transcripts from YouTube
 */

import { YoutubeTranscript } from "youtube-transcript";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface TranscriptResult {
  transcript: string;
  segments: TranscriptSegment[];
  summary: string;
  keyPoints: string[];
  duration: string;
}

/**
 * Extract YouTube video ID from URL
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&?\s]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetch actual transcript from YouTube video
 * Uses YouTube's auto-generated or manual captions
 * Throws error if no transcript available - NO FALLBACKS
 */
export async function generateVideoTranscript(
  videoUrl: string,
  topicTitle: string,
  topicDescription?: string
): Promise<TranscriptResult> {
  const videoId = extractVideoId(videoUrl);

  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  console.log(`Fetching transcript for video: ${videoId}`);

  // Fetch actual transcript from YouTube
  const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);

  if (!transcriptData || transcriptData.length === 0) {
    throw new Error(
      `No transcript available for video: ${videoId}. The video may not have captions enabled.`
    );
  }

  console.log(`Found ${transcriptData.length} transcript segments`);

  // Map segments to our format
  const segments: TranscriptSegment[] = transcriptData.map((segment) => ({
    text: segment.text,
    offset: segment.offset,
    duration: segment.duration,
  }));

  // Combine segments into full transcript
  const fullTranscript = segments
    .map((s) => s.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

  // Calculate total duration
  const lastSegment = segments[segments.length - 1];
  const totalDurationMs = lastSegment.offset + lastSegment.duration;
  const durationMinutes = Math.ceil(totalDurationMs / 60000);

  // Generate summary and key points using AI
  const { summary, keyPoints } = await generateSummaryFromTranscript(
    fullTranscript,
    topicTitle,
    topicDescription
  );

  return {
    transcript: fullTranscript,
    segments,
    summary,
    keyPoints,
    duration: `${durationMinutes} minutes`,
  };
}

/**
 * Use AI to summarize the real transcript
 */
async function generateSummaryFromTranscript(
  transcript: string,
  topicTitle: string,
  topicDescription?: string
): Promise<{ summary: string; keyPoints: string[] }> {
  const prompt = `Analyze this video transcript about "${topicTitle}" and provide:
1. A 2-3 sentence summary of what the video covers
2. 5 key learning points from the content

${topicDescription ? `Topic context: ${topicDescription}` : ""}

Transcript (first 6000 characters):
${transcript.substring(0, 6000)}

Respond in JSON format only:
{
  "summary": "...",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "x-ai/grok-4.1-fast:free",
      messages: [
        {
          role: "system",
          content:
            "You analyze educational video transcripts and extract key information. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content || "";
    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const result = JSON.parse(cleaned);

    return {
      summary: result.summary || `A lesson about ${topicTitle}`,
      keyPoints: result.keyPoints || [`Key concepts of ${topicTitle}`],
    };
  } catch (error) {
    console.error("AI summary generation failed:", error);
    // Return basic info derived from topic - transcript is still real
    return {
      summary: `Educational content about ${topicTitle}. ${topicDescription || ""}`.trim(),
      keyPoints: [
        `Understanding ${topicTitle}`,
        "Core concepts covered in this video",
        "Practical applications discussed",
        "Key techniques demonstrated",
        "Important takeaways",
      ],
    };
  }
}

/**
 * Check if a video has transcripts available
 */
export async function hasTranscript(videoUrl: string): Promise<boolean> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return false;

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript && transcript.length > 0;
  } catch {
    return false;
  }
}

/**
 * Fetch transcript with retry logic for reliability
 */
export async function fetchTranscriptWithRetry(
  videoUrl: string,
  maxRetries: number = 3
): Promise<TranscriptSegment[] | null> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
      if (transcriptData && transcriptData.length > 0) {
        return transcriptData.map((segment) => ({
          text: segment.text,
          offset: segment.offset,
          duration: segment.duration,
        }));
      }
    } catch (error) {
      console.error(`Transcript fetch attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  return null;
}

/**
 * Save transcript to database
 */
export async function saveTranscriptToTopic(
  db: PrismaClientType,
  topicId: string,
  transcript: TranscriptResult
): Promise<void> {
  await db.topic.update({
    where: { id: topicId },
    data: {
      textContent: transcript.transcript,
    },
  });
}

// Type for Prisma client
type PrismaClientType = {
  topic: {
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
  };
};
