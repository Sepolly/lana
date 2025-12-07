import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

const createTopicSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  section: z.string().nullable().optional(),
  sectionOrder: z.number().int().positive().nullable().optional(),
  order: z.number().int().positive().optional(),
  duration: z.number().int().positive().default(30),
  videoUrl: z.string().nullable().optional(),
  videoTranscript: z.string().nullable().optional(),
  pdfUrl: z.string().nullable().optional(),
  textContent: z.string().nullable().optional(),
  interactiveUrl: z.string().nullable().optional(),
});

const updateTopicSchema = createTopicSchema.partial().extend({
  id: z.string().min(1, "Topic ID is required"),
});

/**
 * POST /api/admin/courses/[courseId]/topics
 * Add a new topic to a course
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;
    const body = await request.json();
    const validationResult = createTopicSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid topic data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { topics: true },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const data = validationResult.data;

    // Determine order if not provided
    let order = data.order;
    if (!order) {
      const maxOrder = course.topics.reduce((max, topic) => Math.max(max, topic.order), 0);
      order = maxOrder + 1;
    }

    // Determine section order if not provided
    let sectionOrder = data.sectionOrder;
    if (!sectionOrder && data.section) {
      const topicsInSection = course.topics.filter((t) => t.section === data.section);
      const maxSectionOrder = topicsInSection.reduce(
        (max, topic) => Math.max(max, topic.sectionOrder || 0),
        0
      );
      sectionOrder = maxSectionOrder + 1;
    }

    // Create topic
    const topic = await db.topic.create({
      data: {
        courseId,
        title: data.title,
        description: data.description || null,
        order,
        section: data.section || null,
        sectionOrder: sectionOrder || null,
        duration: data.duration,
        videoUrl: data.videoUrl || null,
        videoTranscript: data.videoTranscript || null,
        pdfUrl: data.pdfUrl || null,
        textContent: data.textContent || null,
        interactiveUrl: data.interactiveUrl || null,
      },
    });

    // Update course duration (sum of all topic durations)
    const totalDuration = await db.topic.aggregate({
      where: { courseId },
      _sum: { duration: true },
    });

    await db.course.update({
      where: { id: courseId },
      data: {
        duration: Math.ceil((totalDuration._sum.duration || 0) / 60), // Convert minutes to hours
      },
    });

    return NextResponse.json({
      success: true,
      message: "Topic created successfully",
      topic: {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        order: topic.order,
        section: topic.section,
        sectionOrder: topic.sectionOrder,
        duration: topic.duration,
        videoUrl: topic.videoUrl,
        pdfUrl: topic.pdfUrl,
        textContent: topic.textContent,
        interactiveUrl: topic.interactiveUrl,
      },
    });
  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create topic",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/courses/[courseId]/topics
 * Update an existing topic
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;
    const body = await request.json();
    const validationResult = updateTopicSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Topic update validation errors:", validationResult.error.issues);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid topic data",
          details: validationResult.error.issues,
          message: validationResult.error.issues
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", "),
        },
        { status: 400 }
      );
    }

    const { id, ...updateData } = validationResult.data;

    // Verify course and topic exist
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const topic = await db.topic.findUnique({
      where: { id },
    });

    if (!topic || topic.courseId !== courseId) {
      return NextResponse.json({ success: false, error: "Topic not found" }, { status: 404 });
    }

    // Clean up empty strings to null and validate URLs
    const cleanedData: Record<string, string | number | null | undefined> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value === "" || value === null) {
        cleanedData[key] = null;
      } else if (key === "videoUrl" || key === "pdfUrl" || key === "interactiveUrl") {
        // Validate URL format if provided, but allow null/empty
        if (typeof value === "string" && value.trim() !== "") {
          try {
            new URL(value);
            cleanedData[key] = value;
          } catch {
            // Invalid URL, set to null
            cleanedData[key] = null;
          }
        } else {
          cleanedData[key] = null;
        }
      } else if (value !== undefined) {
        cleanedData[key] = value;
      }
    }

    // Update topic
    const updatedTopic = await db.topic.update({
      where: { id },
      data: cleanedData,
    });

    // Update course duration
    const totalDuration = await db.topic.aggregate({
      where: { courseId },
      _sum: { duration: true },
    });

    await db.course.update({
      where: { id: courseId },
      data: {
        duration: Math.ceil((totalDuration._sum.duration || 0) / 60),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Topic updated successfully",
      topic: updatedTopic,
    });
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update topic",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/courses/[courseId]/topics
 * Delete a topic
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const topicId = searchParams.get("topicId");

    if (!topicId) {
      return NextResponse.json({ success: false, error: "Topic ID is required" }, { status: 400 });
    }

    // Verify course and topic exist
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const topic = await db.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic || topic.courseId !== courseId) {
      return NextResponse.json({ success: false, error: "Topic not found" }, { status: 404 });
    }

    // Delete topic (cascade will handle related data)
    await db.topic.delete({
      where: { id: topicId },
    });

    // Update course duration
    const totalDuration = await db.topic.aggregate({
      where: { courseId },
      _sum: { duration: true },
    });

    await db.course.update({
      where: { id: courseId },
      data: {
        duration: Math.ceil((totalDuration._sum.duration || 0) / 60),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Topic deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete topic",
      },
      { status: 500 }
    );
  }
}
