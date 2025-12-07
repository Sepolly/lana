/**
 * AI-powered Quiz Generator
 * Generates quiz questions from topic notes using Google Gemini (Node.js SDK)
 */

import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option (0-3)
  explanation: string;
}

export interface GeneratedQuiz {
  questions: GeneratedQuestion[];
  passingScore: number;
}

const GEMINI_MODEL_NAME = "gemini-2.0-flash";

/**
 * Calculate the number of questions to generate based on text content length.
 * More content = more questions, up to a maximum of 10.
 * 
 * @param textContent - The text content to analyze
 * @returns Number of questions to generate (between 3 and 10)
 */
export function calculateQuestionCount(textContent: string): number {
  if (!textContent || textContent.trim().length < 100) {
    return 3; // Minimum questions for very short content
  }
  
  const length = textContent.trim().length;
  
  // Scale questions based on content length:
  // - 100-500 chars: 3 questions
  // - 500-1000 chars: 5 questions
  // - 1000-2000 chars: 7 questions
  // - 2000-3000 chars: 8 questions
  // - 3000-5000 chars: 9 questions
  // - 5000+ chars: 10 questions (maximum)
  
  if (length < 500) return 3;
  if (length < 1000) return 5;
  if (length < 2000) return 7;
  if (length < 3000) return 8;
  if (length < 5000) return 9;
  return 10; // Maximum
}

function getGeminiModel(): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
}

async function callGemini(prompt: string): Promise<string> {
  const model = getGeminiModel();

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const text = result.response.text();
    if (!text) {
      throw new Error("Empty response from Gemini");
    }
    return text;
  } catch (error: any) {
    // Handle specific Gemini API errors
    if (error?.status === 429) {
      throw new Error("API_RATE_LIMIT_EXCEEDED: Gemini API rate limit exceeded. Please try again later.");
    }
    if (error?.status === 403) {
      throw new Error("API_QUOTA_EXCEEDED: Gemini API quota exceeded. Please check your API key and billing.");
    }
    if (error?.status === 500) {
      throw new Error("API_SERVER_ERROR: Gemini API server error. Please try again later.");
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Safely parse JSON from the Gemini response, trying to recover from
 * minor formatting issues like trailing commas or extra text around
 * the JSON block.
 */
type QuizJson = {
  questions?: Record<string, unknown>[];
  passingScore?: number;
};

function safeParseQuizJson(raw: string): QuizJson {
  // Remove markdown code fences if present
  let cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Extract the first top‑level JSON object if there is any extra text
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Fix some common JSON issues Gemini can produce
  cleaned = cleaned
    // Trailing commas before ] or }
    .replace(/,\s*]/g, "]")
    .replace(/,\s*}/g, "}");

  return JSON.parse(cleaned) as QuizJson;
}

/**
 * Generate quiz questions from video transcript content
 */
export async function generateQuizFromTranscript(
  topicTitle: string,
  transcript: string,
  numQuestions?: number
): Promise<GeneratedQuiz> {
  // If numQuestions not provided, calculate based on transcript length
  const questionCount = numQuestions ?? calculateQuestionCount(transcript);
  
  const prompt = `You are an expert educational quiz creator. Your task is to generate ${questionCount} high-quality multiple-choice quiz questions based DIRECTLY on the specific content from this video transcript.

TOPIC: "${topicTitle}"

VIDEO TRANSCRIPT:
---
${transcript}
---

CRITICAL REQUIREMENTS:
1. Questions MUST be based on SPECIFIC facts, concepts, definitions, or examples mentioned in the transcript above
2. Do NOT generate generic questions about the topic - every question must reference something explicitly stated in the transcript
3. Include questions about:
   - Specific terms or definitions mentioned
   - Examples or case studies discussed
   - Steps or processes explained
   - Key facts or statistics mentioned
   - Relationships between concepts discussed
4. Each question must have EXACTLY 4 options
5. correctAnswer is the INDEX (0-3) of the correct option
6. Wrong options should be plausible but clearly incorrect based on the transcript
7. Include the exact quote or reference from transcript in the explanation when possible
8. Mix difficulty appropriately based on the number of questions:
   - For 3-4 questions: 1 easy, 1 medium, 1-2 harder
   - For 5-7 questions: 2 easy, 2-3 medium, 1-2 harder
   - For 8-10 questions: 3 easy, 3-4 medium, 2-3 harder

Generate a JSON response with this EXACT structure:
{
  "questions": [
    {
      "question": "Specific question based on transcript content",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Based on the video: [exact reference to transcript content]"
    }
  ],
  "passingScore": 70
}

Return ONLY valid JSON, no other text.`;

  try {
    const responseText = await callGemini(prompt);

    // Parse the response robustly
    const quizData = safeParseQuizJson(responseText);
    
    // Validate the structure
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error("Invalid quiz structure: missing questions array");
    }
    
    // Validate each question
    const validatedQuestions: GeneratedQuestion[] = quizData.questions
      .filter((q: Record<string, unknown>) => {
        return (
          typeof q.question === 'string' &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          typeof q.correctAnswer === 'number' &&
          q.correctAnswer >= 0 &&
          q.correctAnswer <= 3
        );
      })
      .map((q: Record<string, unknown>) => ({
        question: q.question as string,
        options: q.options as string[],
        correctAnswer: q.correctAnswer as number,
        explanation: (q.explanation as string) || "No explanation provided.",
      }));
    
    if (validatedQuestions.length === 0) {
      throw new Error("No valid questions generated");
    }
    
    return {
      questions: validatedQuestions,
      passingScore: quizData.passingScore || 70,
    };
  } catch (error) {
    console.error("Failed to generate quiz:", error);
    
    // Return fallback quiz
    return createFallbackQuiz(topicTitle, questionCount);
  }
}

/**
 * Generate quiz without transcript (from topic title and description only)
 * This is used as a fallback when video transcript is not available
 */
export async function generateQuizFromTopic(
  topicTitle: string,
  topicDescription: string,
  careerPath: string,
  numQuestions: number = 5
): Promise<GeneratedQuiz> {
  const prompt = `You are an expert educational quiz creator for a ${careerPath} career training course. Create ${numQuestions} high-quality, industry-relevant multiple-choice quiz questions about "${topicTitle}".

TOPIC: "${topicTitle}"
CONTEXT: ${topicDescription}
CAREER PATH: ${careerPath}

CRITICAL REQUIREMENTS:
1. Questions must test REAL, practical knowledge needed for a career in ${careerPath}
2. Include questions about:
   - Core concepts and definitions related to ${topicTitle}
   - Best practices and industry standards
   - Common scenarios and problem-solving
   - Tools, techniques, or methodologies used in ${careerPath}
3. Each question must have EXACTLY 4 options
4. correctAnswer is the INDEX (0-3) of the correct option
5. Wrong options should be plausible misconceptions, not obviously wrong
6. Questions should be relevant to entry-level and intermediate ${careerPath} professionals
7. Explanations should teach something valuable, not just state the answer
8. Mix difficulty: 2 foundational, 2 intermediate, 1 advanced

Generate a JSON response with this EXACT structure:
{
  "questions": [
    {
      "question": "Specific, practical question about ${topicTitle}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Clear explanation with practical context for ${careerPath}"
    }
  ],
  "passingScore": 70
}

Return ONLY valid JSON, no other text.`;

  try {
    const responseText = await callGemini(prompt);

    // Parse the response robustly
    const quizData = safeParseQuizJson(responseText);
    
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error("Invalid quiz structure");
    }
    
    const validatedQuestions: GeneratedQuestion[] = quizData.questions
      .filter((q: Record<string, unknown>) => {
        return (
          typeof q.question === 'string' &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          typeof q.correctAnswer === 'number' &&
          q.correctAnswer >= 0 &&
          q.correctAnswer <= 3
        );
      })
      .map((q: Record<string, unknown>) => ({
        question: q.question as string,
        options: q.options as string[],
        correctAnswer: q.correctAnswer as number,
        explanation: (q.explanation as string) || "No explanation provided.",
      }));
    
    if (validatedQuestions.length === 0) {
      throw new Error("No valid questions generated");
    }
    
    return {
      questions: validatedQuestions,
      passingScore: quizData.passingScore || 70,
    };
  } catch (error) {
    console.error("Failed to generate quiz from topic:", error);
    return createFallbackQuiz(topicTitle, numQuestions);
  }
}

/**
 * Create a fallback quiz when AI generation fails
 */
function createFallbackQuiz(topicTitle: string, numQuestions: number): GeneratedQuiz {
  const fallbackQuestions: GeneratedQuestion[] = [
    {
      question: `What is the primary purpose of learning ${topicTitle}?`,
      options: [
        "To understand fundamental concepts",
        "To skip other learning requirements",
        "To avoid practical applications",
        "To focus only on theory"
      ],
      correctAnswer: 0,
      explanation: "Understanding fundamental concepts is key to mastering any topic."
    },
    {
      question: `Which approach is best when studying ${topicTitle}?`,
      options: [
        "Memorizing without understanding",
        "Skipping practice exercises",
        "Combining theory with hands-on practice",
        "Avoiding related topics"
      ],
      correctAnswer: 2,
      explanation: "Combining theory with practice leads to better learning outcomes."
    },
    {
      question: `What skill is most important when working with ${topicTitle}?`,
      options: [
        "Speed over accuracy",
        "Attention to detail",
        "Avoiding feedback",
        "Working in isolation"
      ],
      correctAnswer: 1,
      explanation: "Attention to detail is crucial for quality work in any field."
    },
    {
      question: `How can you improve your understanding of ${topicTitle}?`,
      options: [
        "Avoid asking questions",
        "Only read theory",
        "Practice regularly and seek feedback",
        "Skip foundational concepts"
      ],
      correctAnswer: 2,
      explanation: "Regular practice and feedback help reinforce learning."
    },
    {
      question: `What is a key benefit of mastering ${topicTitle}?`,
      options: [
        "Fewer career opportunities",
        "Enhanced problem-solving abilities",
        "Limited skill development",
        "Reduced creativity"
      ],
      correctAnswer: 1,
      explanation: "Mastering topics enhances your overall problem-solving abilities."
    }
  ];
  
  return {
    questions: fallbackQuestions.slice(0, numQuestions),
    passingScore: 70,
  };
}

/**
 * Generate comprehensive exam questions from all course topics
 * Creates Stanford/Cambridge-style academic questions
 */
export async function generateExamQuestions(
  topics: Array<{
    id: string;
    title: string;
    videoTranscript?: string | null;
    textContent?: string | null;
    quiz?: {
      questions: Array<{
        question: string;
        options: string[];
        correctAnswer: number;
      }>;
    } | null;
  }>,
  courseTitle: string,
  minQuestions: number = 50
): Promise<GeneratedQuestion[]> {
  // Collect all available content from topics
  const allContent = topics.map(topic => {
    const transcript = topic.videoTranscript || "";
    const textContent = topic.textContent || "";
    return {
      topicId: topic.id,
      topicTitle: topic.title,
      content: transcript + (textContent ? "\n\n" + textContent : ""),
      existingQuestions: topic.quiz?.questions.map(q => q.question.toLowerCase()) || []
    };
  }).filter(item => item.content.trim().length > 0);

  if (allContent.length === 0) {
    throw new Error("No content available to generate exam questions");
  }

  // Calculate questions per topic to ensure we reach at least minQuestions
  // Aim for more questions per topic to guarantee minimum total
  const questionsPerTopic = Math.max(8, Math.ceil(minQuestions * 1.5 / allContent.length));

  const allExamQuestions: GeneratedQuestion[] = [];

  for (const topicContent of allContent) {
    const prompt = `You are a senior academic examiner creating final examination questions for a prestigious university course in ${courseTitle}, following the exacting standards of Stanford and Cambridge University examinations.

TOPIC: "${topicContent.topicTitle}"

SOURCE MATERIAL:
---
${topicContent.content}
---

MANDATORY EXAMINATION REQUIREMENTS:
1. Generate EXACTLY ${questionsPerTopic} multiple-choice questions of university final examination standard
2. Questions MUST conform to Stanford/Cambridge examination rigor:
   - Require deep analytical reasoning and critical thinking
   - Test comprehensive understanding rather than mere recall
   - Demand synthesis and application of concepts
   - Challenge students to evaluate, analyze, and critique
3. ALL QUESTIONS MUST BE DERIVED SOLELY FROM THE SOURCE MATERIAL ABOVE - no external knowledge permitted
4. Question categories to include:
   - Conceptual analysis and theoretical understanding
   - Application of principles to novel scenarios
   - Critical evaluation of methodologies and approaches
   - Comparative analysis of ideas and concepts
   - Synthesis of multiple interrelated concepts
   - Problem-solving using disciplinary frameworks
5. EACH QUESTION MUST HAVE PRECISELY 4 OPTIONS
6. correctAnswer indicates the INDEX (0-3) of the correct option
7. Incorrect options must be intellectually plausible but definitively wrong based on the source material
8. STRICT PROHIBITIONS - Questions must NEVER concern:
   - The lecturer, presenter, or instructor as an individual
   - YouTube channels, social media, or platform-specific content
   - Personal anecdotes, experiences, or biographical details
   - Any non-academic or promotional content
9. Employ formal academic discourse and disciplinary terminology appropriate for advanced undergraduate/postgraduate assessment
10. Questions should compel students to:
    - Discern subtle distinctions between concepts
    - Evaluate the validity of theoretical propositions
    - Apply abstract principles to concrete situations
    - Analyze causal relationships and logical consequences
    - Synthesize disparate elements into coherent frameworks

QUESTION DIFFICULTY DISTRIBUTION:
- 40% Advanced analytical questions requiring synthesis
- 35% Application questions demanding conceptual transfer
- 25% Critical evaluation questions testing theoretical understanding

Generate a JSON response with this EXACT structure:
{
  "questions": [
    {
      "question": "Sophisticated academic question requiring advanced analytical reasoning",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Comprehensive academic explanation with precise references to source material concepts"
    }
  ]
}

Return ONLY valid JSON, no additional text or commentary.`;

    try {
      const responseText = await callGemini(prompt);
      const quizData = safeParseQuizJson(responseText);

      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        throw new Error("Invalid exam questions structure");
      }

      // Validate and filter questions
      const validatedQuestions: GeneratedQuestion[] = quizData.questions
        .filter((q: Record<string, unknown>) => {
          if (!q.question || typeof q.question !== 'string') return false;
          if (!Array.isArray(q.options) || q.options.length !== 4) return false;
          if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) return false;

          // Enhanced duplicate detection using multiple similarity checks
          const questionLower = q.question.toLowerCase().trim();
          const isDuplicate = topicContent.existingQuestions.some(existing => {
            const existingLower = existing.toLowerCase().trim();

            // Exact match check
            if (questionLower === existingLower) return true;

            // Substring similarity (80% overlap minimum)
            const minLength = Math.min(questionLower.length, existingLower.length);
            const maxLength = Math.max(questionLower.length, existingLower.length);
            if (minLength > 20 && (minLength / maxLength) > 0.8) {
              // Check for significant word overlap
              const questionWords = questionLower.split(/\s+/).filter(word => word.length > 3);
              const existingWords = existingLower.split(/\s+/).filter(word => word.length > 3);
              const commonWords = questionWords.filter(word => existingWords.includes(word));
              if (commonWords.length >= Math.min(questionWords.length, existingWords.length) * 0.7) {
                return true;
              }
            }

            // Key phrase similarity (first 10-15 words)
            const questionPhrase = questionLower.split(/\s+/).slice(0, 12).join(' ');
            const existingPhrase = existingLower.split(/\s+/).slice(0, 12).join(' ');
            if (questionPhrase === existingPhrase && questionPhrase.length > 30) {
              return true;
            }

            return false;
          });

          // Comprehensive filtering of personal/presenter content
          const personalKeywords = [
            // Presenter/instructor references
            'presenter', 'instructor', 'lecturer', 'speaker', 'professor', 'teacher',
            'educator', 'expert', 'specialist', 'authority', 'researcher',

            // Personal pronouns and experiences
            'i think', 'i believe', 'i feel', 'i would', 'i have', 'i\'ve',
            'my experience', 'my opinion', 'my view', 'my perspective', 'my approach',
            'in my opinion', 'from my experience', 'i recommend', 'i suggest',

            // Platform/channel content
            'youtube', 'channel', 'subscribe', 'subscription', 'video', 'video series',
            'playlist', 'episode', 'series', 'tutorial', 'course on youtube',

            // Social media and promotion
            'follow me', 'follow us', 'like and subscribe', 'hit the bell',
            'social media', 'twitter', 'instagram', 'facebook', 'linkedin',

            // Personal biographical content
            'my background', 'my career', 'my work', 'my research', 'my study',
            'my university', 'my degree', 'my qualification', 'my expertise',

            // Channel/personal branding
            'welcome back', 'welcome to', 'thank you for watching', 'thanks for watching',
            'if you enjoyed', 'please like', 'comment below', 'share this',

            // Time/engagement references
            'in this video', 'today we', 'let\'s talk about', 'we\'re going to',
            'i\'ll show you', 'we\'ll cover', 'we\'ll discuss', 'we\'ll learn'
          ];

          const hasPersonalContent = personalKeywords.some(keyword =>
            questionLower.includes(keyword.toLowerCase())
          );

          return !isDuplicate && !hasPersonalContent;
        })
        .map((q: Record<string, unknown>) => ({
          question: q.question as string,
          options: q.options as string[],
          correctAnswer: q.correctAnswer as number,
          explanation: (q.explanation as string) || "Based on the academic content presented in the course material.",
        }));

      allExamQuestions.push(...validatedQuestions);

    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      console.error(`Failed to generate exam questions for topic ${topicContent.topicTitle}:`, errorMessage);

      // If it's a rate limit error, we should stop trying to avoid wasting API calls
      if (errorMessage.includes('API_RATE_LIMIT_EXCEEDED') || errorMessage.includes('429')) {
        console.warn('Rate limit exceeded, skipping remaining topic question generation');
        break; // Stop processing other topics to avoid further rate limit hits
      }

      // Continue with other topics for other types of errors
    }
  }

  // If we don't have enough questions, generate additional ones from combined content
  // Cap at reasonable maximum to prevent excessive generation
  const targetQuestions = Math.min(minQuestions, 60);

  if (allExamQuestions.length < targetQuestions) {
    const remainingQuestions = Math.min(targetQuestions - allExamQuestions.length, 30); // Cap additional questions
    const combinedContent = allContent.map(item => `${item.topicTitle}:\n${item.content}`).join('\n\n---\n\n');

    const prompt = `Generate ${remainingQuestions} additional comprehensive exam questions from the combined course content below. Follow the same rigorous academic standards as Stanford/Cambridge final exams.

COMBINED COURSE CONTENT:
---
${combinedContent}
---

Requirements: Same as before - rigorous academic questions, no duplicates, no personal content, exactly 4 options each.

Return ONLY valid JSON with questions array.`;

    try {
      const responseText = await callGemini(prompt);
      const quizData = safeParseQuizJson(responseText);

      if (quizData.questions && Array.isArray(quizData.questions)) {
        const additionalQuestions: GeneratedQuestion[] = quizData.questions
          .filter((q: Record<string, unknown>) => {
            if (!q.question || typeof q.question !== 'string') return false;
            if (!Array.isArray(q.options) || q.options.length !== 4) return false;
            if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) return false;

            // Enhanced duplicate detection for additional questions
            const questionLower = q.question.toLowerCase().trim();
            const isDuplicate = allExamQuestions.some(existing => {
              const existingLower = existing.question.toLowerCase().trim();

              // Exact match check
              if (questionLower === existingLower) return true;

              // Substring similarity (80% overlap minimum)
              const minLength = Math.min(questionLower.length, existingLower.length);
              const maxLength = Math.max(questionLower.length, existingLower.length);
              if (minLength > 20 && (minLength / maxLength) > 0.8) {
                // Check for significant word overlap
                const questionWords = questionLower.split(/\s+/).filter(word => word.length > 3);
                const existingWords = existingLower.split(/\s+/).filter(word => word.length > 3);
                const commonWords = questionWords.filter(word => existingWords.includes(word));
                if (commonWords.length >= Math.min(questionWords.length, existingWords.length) * 0.7) {
                  return true;
                }
              }

              // Key phrase similarity (first 10-15 words)
              const questionPhrase = questionLower.split(/\s+/).slice(0, 12).join(' ');
              const existingPhrase = existingLower.split(/\s+/).slice(0, 12).join(' ');
              if (questionPhrase === existingPhrase && questionPhrase.length > 30) {
                return true;
              }

              return false;
            });

            // Comprehensive filtering of personal/presenter content for additional questions
            const personalKeywords = [
              // Presenter/instructor references
              'presenter', 'instructor', 'lecturer', 'speaker', 'professor', 'teacher',
              'educator', 'expert', 'specialist', 'authority', 'researcher',

              // Personal pronouns and experiences
              'i think', 'i believe', 'i feel', 'i would', 'i have', 'i\'ve',
              'my experience', 'my opinion', 'my view', 'my perspective', 'my approach',
              'in my opinion', 'from my experience', 'i recommend', 'i suggest',

              // Platform/channel content
              'youtube', 'channel', 'subscribe', 'subscription', 'video', 'video series',
              'playlist', 'episode', 'series', 'tutorial', 'course on youtube',

              // Social media and promotion
              'follow me', 'follow us', 'like and subscribe', 'hit the bell',
              'social media', 'twitter', 'instagram', 'facebook', 'linkedin',

              // Personal biographical content
              'my background', 'my career', 'my work', 'my research', 'my study',
              'my university', 'my degree', 'my qualification', 'my expertise',

              // Channel/personal branding
              'welcome back', 'welcome to', 'thank you for watching', 'thanks for watching',
              'if you enjoyed', 'please like', 'comment below', 'share this',

              // Time/engagement references
              'in this video', 'today we', 'let\'s talk about', 'we\'re going to',
              'i\'ll show you', 'we\'ll cover', 'we\'ll discuss', 'we\'ll learn'
            ];

            const hasPersonalContent = personalKeywords.some(keyword =>
              questionLower.includes(keyword.toLowerCase())
            );

            return !isDuplicate && !hasPersonalContent;
          })
          .map((q: Record<string, unknown>) => ({
            question: q.question as string,
            options: q.options as string[],
            correctAnswer: q.correctAnswer as number,
            explanation: (q.explanation as string) || "Based on the academic content presented in the course material.",
          }));

        allExamQuestions.push(...additionalQuestions);
      }
    } catch (error) {
      console.error("Failed to generate additional exam questions:", error);
    }
  }

  // Shuffle and return target number of questions (capped at reasonable maximum)
  const shuffledQuestions = allExamQuestions.sort(() => Math.random() - 0.5);
  const finalCount = Math.min(targetQuestions, shuffledQuestions.length);
  return shuffledQuestions.slice(0, finalCount);
}

/**
 * Save generated quiz to database
 */
export async function saveQuizToDatabase(
  db: PrismaClientType,
  topicId: string,
  quiz: GeneratedQuiz
): Promise<void> {
  // Delete existing quiz for this topic if any
  await db.quiz.deleteMany({
    where: { topicId },
  });

  // Create new quiz with questions
  await db.quiz.create({
    data: {
      topicId,
      title: "Topic Quiz",
      passingScore: quiz.passingScore,
      questions: {
        create: quiz.questions.map((q, index) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          order: index + 1,
        })),
      },
    },
  });
}

// Type for Prisma client
type PrismaClientType = {
  quiz: {
    deleteMany: (args: { where: { topicId: string } }) => Promise<unknown>;
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
};

