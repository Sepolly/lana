/**
 * Career Recommendation Engine
 * Uses RAG (Pinecone + OpenRouter) to recommend careers,
 * generates course structures with AI, and fetches YouTube videos
 */

import { db } from "./db";
import { querySimilar } from "./pinecone";
import { analyzeCareerMatch, generateEmbedding } from "./openrouter";
import type { LearningStyle } from "@prisma/client";
import { slugify } from "./utils";

// Types
export interface UserAptitudeProfile {
  userId: string;
  learningStyle: LearningStyle | null;
  interests: string[];
  strengths: string[];
  goals?: string[];
  education?: string;
}

export interface RecommendedCareer {
  id: string;
  title: string;
  description: string;
  matchScore: number;
  reasoning: string;
  skills: string[];
  category: string;
  averageSalary?: string;
  growthOutlook?: string;
}

export interface GeneratedCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  duration: number;
  skills: string[];
  careerPaths: string[];
  isNew: boolean; // Whether this was newly created or cached
}

/**
 * Main recommendation flow:
 * 1. Query Pinecone with user profile to find matching careers
 * 2. Use OpenRouter to analyze and rank career matches
 * 3. Return top career recommendations
 */
export async function getCareerRecommendationsRAG(
  profile: UserAptitudeProfile
): Promise<RecommendedCareer[]> {
  console.log("Starting RAG career recommendation for user:", profile.userId);

  // Step 1: Generate query embedding from user profile
  const profileText = `
    Interests: ${profile.interests.join(", ")}
    Strengths: ${profile.strengths.join(", ")}
    Learning Style: ${profile.learningStyle || "Not specified"}
    Goals: ${profile.goals?.join(", ") || "Career growth"}
    Education: ${profile.education || "Not specified"}
  `;

  const queryVector = await generateEmbedding(profileText);

  // Step 2: Query Pinecone for similar career profiles
  const pineconeResults = await querySimilar(
    queryVector,
    15, // Get more results for better AI analysis
    undefined,
    { userType: "Employed" }
  );

  console.log(`Found ${pineconeResults.length} career matches in Pinecone`);

  if (pineconeResults.length === 0) {
    console.log("No Pinecone results, using fallback");
    return getFallbackCareers(profile);
  }

  // Step 3: Extract career data from Pinecone results
  const careerData = pineconeResults.map((result) => {
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

    return {
      field: ((result.metadata?.field as string) || "Unknown").trim(),
      skills,
      score: result.score,
    };
  });

  // Step 4: Use OpenRouter to analyze career matches with RAG
  try {
    const analysis = await analyzeCareerMatch(
      {
        interests: profile.interests,
        strengths: profile.strengths,
        learningStyle: profile.learningStyle,
        goals: profile.goals,
      },
      careerData
    );

    // Combine Pinecone scores with AI analysis
    return analysis.topCareers.map((career, idx) => {
      const pineconeMatch = careerData.find(
        (c) => c.field.toLowerCase() === career.title.toLowerCase()
      );

      return {
        id: slugify(career.title),
        title: career.title,
        description: career.reasoning,
        matchScore: career.matchScore,
        reasoning: career.reasoning,
        skills: career.keySkills,
        category: categorizeCareer(career.title),
        averageSalary: estimateSalary(career.title),
        growthOutlook: idx < 2 ? "High" : "Moderate",
      };
    });
  } catch (error) {
    console.error("OpenRouter analysis failed, using Pinecone scores directly:", error);

    // Fallback to Pinecone scores only
    return careerData.slice(0, 5).map((career, idx) => ({
      id: slugify(career.field),
      title: career.field,
      description: `Career in ${career.field} requiring ${career.skills.slice(0, 3).join(", ")}.`,
      matchScore: Math.round(career.score * 100),
      reasoning: `Based on your profile, this career aligns with your strengths and interests.`,
      skills: career.skills,
      category: categorizeCareer(career.field),
      averageSalary: estimateSalary(career.field),
      growthOutlook: idx < 2 ? "High" : "Moderate",
    }));
  }
}

/**
 * Get course for a career path from NeonDB
 * Only returns published courses curated by admin
 * Returns null if no course exists (no AI generation)
 */
export async function getOrCreateCourseForCareer(
  careerPath: string,
  _skills: string[] // Unused but kept for API compatibility
): Promise<GeneratedCourse | null> {
  // Only check NeonDB for published, admin-curated courses
  const existingCourse = await db.course.findFirst({
    where: {
      careerPaths: { has: careerPath },
      isPublished: true, // Only return published courses
    },
    include: {
      topics: {
        orderBy: [{ sectionOrder: "asc" }, { order: "asc" }],
      },
    },
  });

  if (existingCourse) {
    console.log(`✅ Found curated course: ${existingCourse.title}`);
    return {
      id: existingCourse.id,
      title: existingCourse.title,
      slug: existingCourse.slug,
      description: existingCourse.description,
      level: existingCourse.level,
      duration: existingCourse.duration,
      skills: existingCourse.skills,
      careerPaths: existingCourse.careerPaths,
      isNew: false,
    };
  }

  // No course found - return null (don't generate)
  console.log(`⚠️ No curated course found for: ${careerPath}`);
  return null;
}

/**
 * Complete recommendation flow:
 * 1. Get career recommendations
 * 2. For selected career, get course from NeonDB (admin-curated)
 */
export async function processCareerSelection(
  userId: string,
  selectedCareer: RecommendedCareer
): Promise<GeneratedCourse | null> {
  console.log(`Processing career selection: ${selectedCareer.title} for user ${userId}`);

  // Get course from NeonDB (only published, admin-curated courses)
  const course = await getOrCreateCourseForCareer(selectedCareer.title, selectedCareer.skills);

  if (course) {
    // Update user's recommended courses in profile
    await db.studentProfile.update({
      where: { userId },
      data: {
        recommendedCourses: {
          push: {
            courseId: course.id,
            title: course.title,
            careerPath: selectedCareer.title,
            matchScore: selectedCareer.matchScore,
            createdAt: new Date().toISOString(),
          },
        },
      },
    });
  }

  return course;
}

/**
 * Get all courses for a user's recommended careers
 */
export async function getCoursesForRecommendedCareers(
  careers: RecommendedCareer[]
): Promise<GeneratedCourse[]> {
  const courses: GeneratedCourse[] = [];

  for (const career of careers.slice(0, 3)) {
    // Limit to top 3
    try {
      const course = await getOrCreateCourseForCareer(career.title, career.skills);
      if (course) {
        courses.push(course);
      }
    } catch (error) {
      console.error(`Failed to get course for ${career.title}:`, error);
    }
  }

  return courses;
}

// Helper functions

/**
 * Create a comprehensive fallback course structure with university-level topics
 */
function createFallbackCourseStructure(
  careerPath: string,
  skills: string[]
): {
  title: string;
  slug: string;
  description: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  duration: number;
  skills: string[];
  careerPaths: string[];
  topics: {
    title: string;
    description: string;
    order: number;
    duration: number;
    searchQuery: string;
  }[];
} {
  const slug = slugify(careerPath);

  // Generate comprehensive topics based on career path (minimum 25 topics)
  const topicTemplates = [
    // Phase 1: Introduction & Foundations (1-5)
    {
      title: `What is ${careerPath}?`,
      desc: `Complete overview of ${careerPath}, its history, and career opportunities in the field.`,
      level: "beginner",
    },
    {
      title: `The ${careerPath} Industry Landscape`,
      desc: `Understanding the current industry, major players, and where ${careerPath} is heading.`,
      level: "beginner",
    },
    {
      title: `Essential ${careerPath} Terminology`,
      desc: `Key terms, concepts, and vocabulary every ${careerPath} professional must know.`,
      level: "beginner",
    },
    {
      title: `Setting Up Your ${careerPath} Environment`,
      desc: `Installing and configuring the essential tools and software for ${careerPath}.`,
      level: "beginner",
    },
    {
      title: `${careerPath} Career Paths`,
      desc: `Exploring different specializations and career trajectories in ${careerPath}.`,
      level: "beginner",
    },

    // Phase 2: Core Fundamentals (6-12)
    {
      title: `${careerPath} Fundamentals Part 1`,
      desc: `Core principles and foundational concepts that form the basis of ${careerPath}.`,
      level: "beginner",
    },
    {
      title: `${careerPath} Fundamentals Part 2`,
      desc: `Building on the basics with essential techniques and methodologies.`,
      level: "beginner",
    },
    {
      title: `Hands-On ${careerPath} Basics`,
      desc: `Your first practical project in ${careerPath} with step-by-step guidance.`,
      level: "beginner",
    },
    {
      title: `${careerPath} Tools Mastery`,
      desc: `Deep dive into the primary tools used by ${careerPath} professionals.`,
      level: "beginner",
    },
    {
      title: `${careerPath} Workflows`,
      desc: `Standard workflows, processes, and best practices in ${careerPath}.`,
      level: "beginner",
    },
    {
      title: `Problem Solving in ${careerPath}`,
      desc: `Developing a problem-solving mindset specific to ${careerPath} challenges.`,
      level: "beginner",
    },
    {
      title: `${careerPath} Project 1`,
      desc: `Complete your first full project applying all fundamental skills learned.`,
      level: "beginner",
    },

    // Phase 3: Intermediate Skills (13-20)
    {
      title: `Intermediate ${careerPath} Techniques`,
      desc: `Advanced techniques that separate beginners from intermediate practitioners.`,
      level: "intermediate",
    },
    {
      title: `${careerPath} Design Patterns`,
      desc: `Common patterns and approaches used by experienced professionals.`,
      level: "intermediate",
    },
    {
      title: `Advanced ${careerPath} Tools`,
      desc: `Mastering advanced features of professional ${careerPath} tools.`,
      level: "intermediate",
    },
    {
      title: `${careerPath} Collaboration`,
      desc: `Working effectively with teams, version control, and collaboration tools.`,
      level: "intermediate",
    },
    {
      title: `${careerPath} Quality Assurance`,
      desc: `Testing, reviewing, and ensuring quality in ${careerPath} work.`,
      level: "intermediate",
    },
    {
      title: `${careerPath} Performance Optimization`,
      desc: `Techniques for improving efficiency and performance in ${careerPath}.`,
      level: "intermediate",
    },
    {
      title: `Industry Standards in ${careerPath}`,
      desc: `Understanding and applying industry standards and best practices.`,
      level: "intermediate",
    },
    {
      title: `${careerPath} Project 2`,
      desc: `A comprehensive intermediate project that challenges your growing skills.`,
      level: "intermediate",
    },

    // Phase 4: Advanced & Professional (21-30)
    {
      title: `Advanced ${careerPath} Mastery`,
      desc: `Expert-level techniques used by senior ${careerPath} professionals.`,
      level: "advanced",
    },
    {
      title: `${careerPath} Architecture`,
      desc: `Understanding and designing large-scale ${careerPath} solutions.`,
      level: "advanced",
    },
    {
      title: `${careerPath} Leadership`,
      desc: `Leading ${careerPath} teams and projects effectively.`,
      level: "advanced",
    },
    {
      title: `${careerPath} Innovation`,
      desc: `Staying current with emerging trends and innovations in ${careerPath}.`,
      level: "advanced",
    },
    {
      title: `Building Your ${careerPath} Portfolio`,
      desc: `Creating a professional portfolio that showcases your best work.`,
      level: "advanced",
    },
    {
      title: `${careerPath} Interview Preparation`,
      desc: `Preparing for technical interviews and assessments in ${careerPath}.`,
      level: "advanced",
    },
    {
      title: `Freelancing in ${careerPath}`,
      desc: `Building a freelance career and finding clients in ${careerPath}.`,
      level: "advanced",
    },
    {
      title: `${careerPath} Capstone Project`,
      desc: `Your final comprehensive project demonstrating professional-level skills.`,
      level: "advanced",
    },
    {
      title: `${careerPath} Career Launch`,
      desc: `Final steps to launching your career: networking, job search, and negotiation.`,
      level: "advanced",
    },
    {
      title: `Continuous Learning in ${careerPath}`,
      desc: `Strategies for staying current and growing your ${careerPath} career long-term.`,
      level: "advanced",
    },
  ];

  // Add skill-specific topics
  const skillTopics = skills.map((skill, idx) => ({
    title: `Mastering ${skill}`,
    desc: `Comprehensive deep-dive into ${skill} and its applications in ${careerPath}.`,
    level:
      idx < skills.length / 3
        ? "beginner"
        : idx < (skills.length * 2) / 3
          ? "intermediate"
          : "advanced",
  }));

  // Create final topics list
  const allTopics = [
    ...topicTemplates.map((template, idx) => ({
      title: template.title,
      description: template.desc,
      order: idx + 1,
      duration: 35 + Math.floor(Math.random() * 25), // 35-60 minutes
      searchQuery: `${careerPath} ${template.title.toLowerCase()} complete tutorial ${template.level}`,
    })),
    ...skillTopics.map((topic, idx) => ({
      title: topic.title,
      description: topic.desc,
      order: topicTemplates.length + idx + 1,
      duration: 40 + Math.floor(Math.random() * 20), // 40-60 minutes
      searchQuery: `${careerPath} ${skills[idx]} tutorial`,
    })),
  ];

  return {
    title: `Complete ${careerPath} Professional Certification`,
    slug,
    description: `A comprehensive, university-level curriculum designed to take you from complete beginner to industry-ready ${careerPath} professional. This course covers ${allTopics.length} in-depth topics including ${skills.slice(0, 3).join(", ")}.`,
    level: "BEGINNER",
    duration: Math.ceil(allTopics.reduce((sum, t) => sum + t.duration, 0) / 60),
    skills,
    careerPaths: [careerPath],
    topics: allTopics,
  };
}

function categorizeCareer(title: string): string {
  const titleLower = title.toLowerCase();

  if (
    titleLower.includes("software") ||
    titleLower.includes("developer") ||
    titleLower.includes("engineer") ||
    titleLower.includes("technology") ||
    titleLower.includes("it")
  ) {
    return "Technology";
  }
  if (
    titleLower.includes("design") ||
    titleLower.includes("creative") ||
    titleLower.includes("art")
  ) {
    return "Creative";
  }
  if (titleLower.includes("marketing") || titleLower.includes("sales")) {
    return "Marketing";
  }
  if (
    titleLower.includes("finance") ||
    titleLower.includes("accounting") ||
    titleLower.includes("bank")
  ) {
    return "Finance";
  }
  if (
    titleLower.includes("health") ||
    titleLower.includes("medical") ||
    titleLower.includes("nurse")
  ) {
    return "Healthcare";
  }
  if (
    titleLower.includes("manage") ||
    titleLower.includes("business") ||
    titleLower.includes("admin")
  ) {
    return "Business";
  }
  if (titleLower.includes("teach") || titleLower.includes("education")) {
    return "Education";
  }

  return "General";
}

function estimateSalary(title: string): string {
  const titleLower = title.toLowerCase();

  if (titleLower.includes("software") || titleLower.includes("engineer")) {
    return "$60,000 - $120,000";
  }
  if (titleLower.includes("manage") || titleLower.includes("director")) {
    return "$70,000 - $150,000";
  }
  if (titleLower.includes("design")) {
    return "$40,000 - $80,000";
  }
  if (titleLower.includes("marketing")) {
    return "$45,000 - $90,000";
  }
  if (titleLower.includes("finance")) {
    return "$55,000 - $110,000";
  }

  return "$40,000 - $80,000";
}

function generateTopicTextContent(title: string, description: string, careerPath: string): string {
  return `# ${title}

${description}

## Learning Objectives

By the end of this topic, you will be able to:
- Understand the fundamentals of ${title.toLowerCase()}
- Apply key concepts in real-world scenarios
- Build upon this knowledge for your career in ${careerPath}

## Key Concepts

This topic covers essential skills needed for success in ${careerPath}. Watch the video above and take notes on the main concepts discussed.

## Practice

After watching the video:
1. Summarize the key points in your own words
2. Try to apply what you learned to a small project
3. Complete the quiz to test your understanding

---

*Remember: Learning is a journey. Take your time and don't hesitate to rewatch sections you find challenging.*
`;
}

/**
 * Infer section name from topic order
 */
function inferSectionFromOrder(order: number): string {
  if (order <= 5) return "Introduction & Foundations";
  if (order <= 12) return "Core Fundamentals";
  if (order <= 18) return "Intermediate Skills";
  if (order <= 23) return "Advanced & Professional";
  return "Career Launch";
}

function getFallbackCareers(profile: UserAptitudeProfile): RecommendedCareer[] {
  const careers: RecommendedCareer[] = [
    {
      id: "software-developer",
      title: "Software Developer",
      description: "Design and build software applications",
      matchScore: 85,
      reasoning: "Technology-focused career with high demand",
      skills: ["Programming", "Problem Solving", "Communication"],
      category: "Technology",
      averageSalary: "$60,000 - $120,000",
      growthOutlook: "High",
    },
    {
      id: "data-analyst",
      title: "Data Analyst",
      description: "Analyze data to drive business decisions",
      matchScore: 80,
      reasoning: "Growing field with analytical focus",
      skills: ["Data Analysis", "Excel", "SQL"],
      category: "Technology",
      averageSalary: "$50,000 - $90,000",
      growthOutlook: "High",
    },
    {
      id: "digital-marketer",
      title: "Digital Marketer",
      description: "Create and manage digital marketing campaigns",
      matchScore: 75,
      reasoning: "Creative career with business impact",
      skills: ["Marketing", "Social Media", "Analytics"],
      category: "Marketing",
      averageSalary: "$40,000 - $80,000",
      growthOutlook: "Moderate",
    },
  ];

  // Adjust scores based on profile
  return careers.map((career) => {
    let bonus = 0;
    if (
      profile.interests.some((i) => i.toLowerCase().includes("tech")) &&
      career.category === "Technology"
    ) {
      bonus += 10;
    }
    if (
      profile.interests.some((i) => i.toLowerCase().includes("creative")) &&
      career.category === "Creative"
    ) {
      bonus += 10;
    }
    return { ...career, matchScore: Math.min(99, career.matchScore + bonus) };
  });
}
