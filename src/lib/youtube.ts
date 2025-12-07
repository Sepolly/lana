/**
 * YouTube Data API Integration
 * Fetches educational videos for course topics
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  duration?: string;
  viewCount?: string;
  publishedAt: string;
  url: string;
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  nextPageToken?: string;
}

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";

/**
 * Search for videos on YouTube using the Data API
 * Requires YOUTUBE_API_KEY environment variable
 */
export async function searchVideos(
  query: string,
  options: {
    maxResults?: number;
    order?: "relevance" | "date" | "viewCount" | "rating";
    videoDuration?: "short" | "medium" | "long";
    type?: "video" | "channel" | "playlist";
    pageToken?: string;
  } = {}
): Promise<YouTubeSearchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("❌ YOUTUBE_API_KEY is not set in environment variables");
    throw new Error("YouTube API key is required. Please set YOUTUBE_API_KEY in your .env file");
  }

  const {
    maxResults = 5,
    order = "relevance",
    videoDuration = "medium",
    type = "video",
    pageToken,
  } = options;

  console.log(`🔍 Searching YouTube for: "${query}"`);

  try {
    const params = new URLSearchParams({
      key: apiKey,
      q: `${query} tutorial educational`,
      part: "snippet",
      type,
      maxResults: maxResults.toString(),
      order,
      videoDuration,
      videoEmbeddable: "true",
      safeSearch: "strict",
      relevanceLanguage: "en",
      ...(pageToken && { pageToken }),
    });

    const searchResponse = await fetch(`${YOUTUBE_API_URL}/search?${params.toString()}`);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("❌ YouTube Search API error:", searchResponse.status, errorText);
      throw new Error(`YouTube API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      console.warn(`⚠️ No videos found for query: "${query}"`);
      return { videos: [] };
    }

    console.log(`✅ Found ${searchData.items.length} videos for "${query}"`);

    // Get video IDs for additional details
    const videoIds = searchData.items
      .map((item: { id: { videoId?: string } }) => item.id.videoId)
      .filter(Boolean)
      .join(",");

    if (!videoIds) {
      return { videos: [] };
    }

    // Fetch video details (duration, view count)
    const detailsParams = new URLSearchParams({
      key: apiKey,
      id: videoIds,
      part: "contentDetails,statistics",
    });

    const detailsResponse = await fetch(`${YOUTUBE_API_URL}/videos?${detailsParams.toString()}`);

    let videoDetails: Record<string, { duration?: string; viewCount?: string }> = {};

    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json();
      videoDetails = detailsData.items?.reduce(
        (
          acc: Record<string, { duration?: string; viewCount?: string }>,
          item: {
            id: string;
            contentDetails?: { duration?: string };
            statistics?: { viewCount?: string };
          }
        ) => {
          acc[item.id] = {
            duration: parseDuration(item.contentDetails?.duration || ""),
            viewCount: formatViewCount(item.statistics?.viewCount || "0"),
          };
          return acc;
        },
        {}
      );
    }

    const videos: YouTubeVideo[] = searchData.items
      .filter((item: { id: { videoId?: string } }) => item.id.videoId)
      .map(
        (item: {
          id: { videoId: string };
          snippet: {
            title: string;
            description: string;
            thumbnails: {
              high?: { url: string };
              medium?: { url: string };
              default?: { url: string };
            };
            channelTitle: string;
            publishedAt: string;
          };
        }) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl:
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.medium?.url ||
            item.snippet.thumbnails.default?.url ||
            "",
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          duration: videoDetails[item.id.videoId]?.duration,
          viewCount: videoDetails[item.id.videoId]?.viewCount,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        })
      );

    return {
      videos,
      nextPageToken: searchData.nextPageToken,
    };
  } catch (error) {
    console.error("❌ YouTube API error:", error);
    throw error;
  }
}

/**
 * Get top educational video for a topic
 */
export async function getTopVideoForTopic(searchQuery: string): Promise<YouTubeVideo | null> {
  try {
    const result = await searchVideos(searchQuery, {
      maxResults: 1,
      order: "relevance",
      videoDuration: "medium", // 4-20 minutes
    });

    if (result.videos.length > 0) {
      console.log(`📹 Found video for "${searchQuery}": ${result.videos[0].title}`);
      return result.videos[0];
    }

    // Try again with "long" duration if medium didn't work
    const longResult = await searchVideos(searchQuery, {
      maxResults: 1,
      order: "relevance",
      videoDuration: "long",
    });

    if (longResult.videos.length > 0) {
      console.log(`📹 Found long video for "${searchQuery}": ${longResult.videos[0].title}`);
      return longResult.videos[0];
    }

    // Try without duration filter as last resort
    const anyResult = await searchVideos(searchQuery, {
      maxResults: 1,
      order: "viewCount", // Get most popular
    });

    return anyResult.videos[0] || null;
  } catch (error) {
    console.error(`❌ Failed to get video for topic: ${searchQuery}`, error);
    return null;
  }
}

/**
 * Get multiple videos for a topic
 */
export async function getVideosForTopic(
  searchQuery: string,
  count: number = 3
): Promise<YouTubeVideo[]> {
  try {
    const result = await searchVideos(searchQuery, {
      maxResults: count,
      order: "relevance",
      videoDuration: "medium",
    });
    return result.videos;
  } catch (error) {
    console.error(`❌ Failed to get videos for: ${searchQuery}`, error);
    return [];
  }
}

/**
 * Parse ISO 8601 duration to readable format
 */
function parseDuration(duration: string): string {
  if (!duration) return "";

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format view count to readable string
 */
function formatViewCount(count: string): string {
  const num = parseInt(count, 10);
  if (isNaN(num)) return "0 views";

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M views`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K views`;
  }
  return `${count} views`;
}

/**
 * Batch fetch videos for multiple topics
 * Uses the YouTube API to get one video per topic
 */
export async function getVideosForTopics(
  topics: { title: string; searchQuery: string }[]
): Promise<Map<string, YouTubeVideo | null>> {
  const results = new Map<string, YouTubeVideo | null>();

  console.log(`\n📚 Fetching YouTube videos for ${topics.length} topics...`);

  // Check for API key first
  if (!process.env.YOUTUBE_API_KEY) {
    console.error("❌ YOUTUBE_API_KEY is not set!");
    throw new Error("YouTube API key is required");
  }

  // Process in batches to avoid rate limiting
  const batchSize = 3;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < topics.length; i += batchSize) {
    const batch = topics.slice(i, i + batchSize);
    console.log(
      `\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(topics.length / batchSize)}`
    );

    const batchResults = await Promise.all(
      batch.map(async (topic) => {
        try {
          const video = await getTopVideoForTopic(topic.searchQuery);
          if (video) {
            successCount++;
            return video;
          }
          failCount++;
          return null;
        } catch (error) {
          console.error(`Failed to fetch video for: ${topic.title}`);
          failCount++;
          return null;
        }
      })
    );

    batch.forEach((topic, idx) => {
      results.set(topic.title, batchResults[idx]);
    });

    // Rate limiting delay between batches
    if (i + batchSize < topics.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`\n✅ YouTube fetch complete: ${successCount} videos found, ${failCount} failed`);

  return results;
}

/**
 * Update existing topics with YouTube videos
 * Can be used to refresh videos for a course
 */
export async function updateTopicsWithVideos(
  topics: { id: string; title: string; searchQuery: string }[],
  updateFn: (topicId: string, videoUrl: string, videoInfo: string) => Promise<void>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const topic of topics) {
    try {
      const video = await getTopVideoForTopic(topic.searchQuery);
      if (video) {
        await updateFn(topic.id, video.url, `${video.title} by ${video.channelTitle}`);
        success++;
        console.log(`✅ Updated video for: ${topic.title}`);
      } else {
        failed++;
        console.warn(`⚠️ No video found for: ${topic.title}`);
      }
    } catch (error) {
      failed++;
      console.error(`❌ Failed to update video for: ${topic.title}`, error);
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return { success, failed };
}
