import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTopVideoForTopic } from "@/lib/youtube";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/courses/[slug]/refresh-videos
 * Refreshes YouTube videos for all topics in a course
 * Fetches the top relevant video for each topic based on the YouTube API
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const { slug } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify YouTube API key is available
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "YouTube API key is not configured" },
        { status: 500 }
      );
    }

    // Get the course with all topics
    const course = await db.course.findUnique({
      where: { slug },
      include: {
        topics: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    const careerPath = course.careerPaths[0] || course.title;
    console.log(`\n🔄 Refreshing videos for course: ${course.title}`);
    console.log(`📚 Total topics: ${course.topics.length}`);
    console.log(`🎯 Career path: ${careerPath}`);

    // Track used video IDs to prevent duplicates in the same course
    const usedVideoIds: Set<string> = new Set();
    
    // Helper function to extract video ID from URL
    const extractVideoId = (url: string): string | null => {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/);
      return match ? match[1] : null;
    };
    
    // Helper function to check if a video is already used
    const isVideoUsed = (url: string): boolean => {
      const videoId = extractVideoId(url);
      return videoId ? usedVideoIds.has(videoId) : false;
    };
    
    // Helper function to mark a video as used
    const markVideoUsed = (url: string): void => {
      const videoId = extractVideoId(url);
      if (videoId) usedVideoIds.add(videoId);
    };

    let updated = 0;
    let failed = 0;
    let duplicatesAvoided = 0;
    const results: { topic: string; status: string; videoUrl?: string; videoTitle?: string }[] = [];

    // Process each topic
    for (const topic of course.topics) {
      // Build search query - ALWAYS include career path/course name for context
      const searchQuery = `${careerPath} ${topic.title} tutorial`;
      
      console.log(`\n🔍 Topic ${topic.order}: "${topic.title}"`);
      console.log(`   Search: "${searchQuery}"`);

      try {
        let video = await getTopVideoForTopic(searchQuery);
        let videoSelected = false;

        // Check if first video is valid and not already used
        if (video && video.url && video.url.includes('watch?v=')) {
          if (!isVideoUsed(video.url)) {
            videoSelected = true;
          } else {
            console.log(`   ⚠️ Video already used in this course, searching for alternative...`);
            duplicatesAvoided++;
          }
        }

        // If no video or duplicate, try alternative searches - ALL include career path
        if (!videoSelected) {
          const altQueries = [
            `${careerPath} ${topic.title} explained`,
            `${careerPath} ${topic.title} complete guide`,
            `${careerPath} learn ${topic.title} step by step`,
            `${careerPath} ${topic.title} for beginners`,
            `${careerPath} ${topic.title} introduction`,
            `${careerPath} ${topic.title} basics`,
          ];

          for (const altQuery of altQueries) {
            console.log(`   ⚠️ Trying alternative: "${altQuery}"`);
            const altVideo = await getTopVideoForTopic(altQuery);
            
            if (altVideo && altVideo.url && altVideo.url.includes('watch?v=') && !isVideoUsed(altVideo.url)) {
              video = altVideo;
              videoSelected = true;
              break;
            }
            
            // Small delay between retries
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        if (videoSelected && video && video.url) {
          // Mark video as used
          markVideoUsed(video.url);
          
          // Update the topic with the video URL
          await db.topic.update({
            where: { id: topic.id },
            data: {
              videoUrl: video.url,
              videoTranscript: `Video: ${video.title} by ${video.channelTitle}`,
            },
          });

          updated++;
          results.push({
            topic: topic.title,
            status: "success",
            videoUrl: video.url,
            videoTitle: video.title,
          });

          console.log(`   ✅ Found: ${video.title}`);
          console.log(`   📺 URL: ${video.url}`);
        } else {
          failed++;
          results.push({
            topic: topic.title,
            status: "no_unique_video_found",
          });
          console.warn(`   ❌ No valid unique video found`);
        }
      } catch (error) {
        failed++;
        results.push({
          topic: topic.title,
          status: "error",
        });
        console.error(`   ❌ Error:`, error);
      }

      // Rate limiting between requests (300ms)
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log(`\n📊 Refresh complete: ${updated} updated, ${failed} failed, ${duplicatesAvoided} duplicates avoided`);
    console.log(`📊 Unique videos: ${usedVideoIds.size}`);

    return NextResponse.json({
      success: true,
      message: `Refreshed videos for ${course.title}`,
      stats: {
        total: course.topics.length,
        updated,
        failed,
        duplicatesAvoided,
        uniqueVideos: usedVideoIds.size,
      },
      results,
    });
  } catch (error) {
    console.error("Video refresh error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to refresh videos" 
      },
      { status: 500 }
    );
  }
}

