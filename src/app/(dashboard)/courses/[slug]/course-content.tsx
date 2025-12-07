"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardContent, Button, Mascot } from "@/components/ui";
import {
  CheckCircle2,
  Lock,
  Clock,
  BookOpen,
  Award,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Loader2,
  Play,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import Link from "next/link";
import { QuizModal } from "@/components/quiz-modal";
import type {
  LearningStyle,
  Course,
  Topic,
  Quiz,
  QuizQuestion,
  Enrollment,
  TopicProgress,
} from "@prisma/client";

// Dynamic import with SSR disabled to prevent hydration issues with YouTube iframe API
const YouTubePlayer = dynamic(
  () => import("@/components/youtube-player").then((mod) => mod.YouTubePlayer),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-black">
        <div className="border-secondary/30 border-t-primary h-16 w-16 animate-spin rounded-full border-4" />
      </div>
    ),
  }
);

type TopicWithQuiz = Topic & {
  quiz: (Quiz & { questions: QuizQuestion[] }) | null;
};

type CourseWithTopics = Course & {
  topics: TopicWithQuiz[];
};

type EnrollmentWithProgress =
  | (Enrollment & {
      topicProgress: TopicProgress[];
    })
  | null;

interface CourseContentProps {
  course: CourseWithTopics;
  enrollment: EnrollmentWithProgress;
  userId: string;
  learningStyle: LearningStyle | null;
}

// Group topics by section
interface TopicSection {
  name: string;
  topics: TopicWithQuiz[];
}

function groupTopicsBySection(topics: TopicWithQuiz[]): TopicSection[] {
  const sectionMap = new Map<string, TopicWithQuiz[]>();
  const defaultSections = [
    "Introduction & Foundations",
    "Core Fundamentals",
    "Intermediate Skills",
    "Advanced & Professional",
    "Career Launch",
  ];

  topics.forEach((topic, index) => {
    let sectionName = (topic as TopicWithQuiz & { section?: string }).section;

    if (!sectionName) {
      if (index < 5) sectionName = "Introduction & Foundations";
      else if (index < 12) sectionName = "Core Fundamentals";
      else if (index < 18) sectionName = "Intermediate Skills";
      else if (index < 23) sectionName = "Advanced & Professional";
      else sectionName = "Career Launch";
    }

    if (!sectionMap.has(sectionName)) {
      sectionMap.set(sectionName, []);
    }
    sectionMap.get(sectionName)!.push(topic);
  });

  const orderedSections: TopicSection[] = [];
  defaultSections.forEach((sectionName) => {
    if (sectionMap.has(sectionName)) {
      orderedSections.push({
        name: sectionName,
        topics: sectionMap.get(sectionName)!.sort((a, b) => a.order - b.order),
      });
      sectionMap.delete(sectionName);
    }
  });

  sectionMap.forEach((topics, name) => {
    orderedSections.push({
      name,
      topics: topics.sort((a, b) => a.order - b.order),
    });
  });

  return orderedSections;
}

export function CourseContent({
  course,
  enrollment: initialEnrollment,
  userId: _userId,
  learningStyle: _learningStyle,
}: CourseContentProps) {
  const router = useRouter();
  const [enrollment, setEnrollment] = React.useState(initialEnrollment);
  const [isEnrolling, setIsEnrolling] = React.useState(false);
  const [activeTopic, setActiveTopic] = React.useState<TopicWithQuiz | null>(null);
  const [showQuizModal, setShowQuizModal] = React.useState(false);
  const [_videoProgress, setVideoProgress] = React.useState(0);
  const [videoCompleted, setVideoCompleted] = React.useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = React.useState(false);
  const [generatedQuiz, setGeneratedQuiz] = React.useState<
    (Quiz & { questions: QuizQuestion[] }) | null
  >(null);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(["Introduction & Foundations", "Core Fundamentals"])
  );
  const [localProgress, setLocalProgress] = React.useState<
    Map<string, { isCompleted: boolean; videoWatched: boolean; videoProgress: number }>
  >(new Map());

  // Quiz performance state for completed topics and topics with existing attempts
  const [quizPerformance, setQuizPerformance] = React.useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
    completedAt: string;
  } | null>(null);
  const [isLoadingQuizPerformance, setIsLoadingQuizPerformance] = React.useState(false);
  const [hasQuizAttempt, setHasQuizAttempt] = React.useState(false);

  // Sidebar state - default to collapsed on mobile
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true);

  // Auto-collapse sidebar on mobile when topic is selected
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && activeTopic) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTopic]);

  const isEnrolled = !!enrollment;

  // Merge server progress with local progress for immediate UI updates
  const progressMap = React.useMemo(() => {
    const map = new Map(enrollment?.topicProgress.map((p) => [p.topicId, p]) || []);
    localProgress.forEach((progress, topicId) => {
      const existing = map.get(topicId);
      if (existing) {
        map.set(topicId, { ...existing, ...progress });
      } else {
        map.set(topicId, progress as unknown as TopicProgress);
      }
    });
    return map;
  }, [enrollment?.topicProgress, localProgress]);

  const sections = React.useMemo(() => groupTopicsBySection(course.topics), [course.topics]);

  // Auto-select first topic if enrolled and none selected
  React.useEffect(() => {
    if (isEnrolled && !activeTopic && course.topics.length > 0) {
      const firstIncomplete = course.topics.find((topic) => {
        const progress = progressMap.get(topic.id);
        return !progress?.isCompleted;
      });
      setActiveTopic(firstIncomplete || course.topics[0]);
    }
  }, [isEnrolled, activeTopic, course.topics, progressMap]);

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  const getTopicStatus = (
    topic: TopicWithQuiz,
    topicIndex: number
  ): "completed" | "available" | "locked" => {
    const progress = progressMap.get(topic.id);
    if (progress?.isCompleted) return "completed";
    if (topicIndex === 0) return "available";
    const prevTopic = course.topics[topicIndex - 1];
    const prevProgress = progressMap.get(prevTopic.id);
    if (prevProgress?.isCompleted) return "available";
    return "locked";
  };

  const getSectionProgress = (section: TopicSection) => {
    let completed = 0;
    section.topics.forEach((topic) => {
      if (progressMap.get(topic.id)?.isCompleted) completed++;
    });
    return { completed, total: section.topics.length };
  };

  const calculateOverallProgress = () => {
    const completedCount = Array.from(progressMap.values()).filter((p) => p.isCompleted).length;
    return (completedCount / course.topics.length) * 100;
  };

  const canTakeExam = () => {
    // Check if all topics are completed (which includes passing quizzes)
    return course.topics.every((topic) => progressMap.get(topic.id)?.isCompleted);
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const response = await fetch(`/api/courses/${course.slug}/enroll`, { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        setEnrollment({ ...data.enrollment, topicProgress: [] });
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to enroll:", error);
    } finally {
      setIsEnrolling(false);
    }
  };

  const getGlobalTopicIndex = (topicId: string): number => {
    return course.topics.findIndex((t) => t.id === topicId);
  };

  const getNextTopic = (currentTopicId: string): TopicWithQuiz | null => {
    const currentIndex = course.topics.findIndex((t) => t.id === currentTopicId);
    if (currentIndex >= 0 && currentIndex < course.topics.length - 1) {
      return course.topics[currentIndex + 1];
    }
    return null;
  };

  const isLastTopic = activeTopic
    ? course.topics.findIndex((t) => t.id === activeTopic.id) === course.topics.length - 1
    : false;

  React.useEffect(() => {
    // Always reset all video/quiz state when topic changes
    setVideoProgress(0);
    setVideoCompleted(false);
    setShowQuizModal(false);
    setGeneratedQuiz(null);
    setIsGeneratingQuiz(false);
    setQuizPerformance(null);
    setHasQuizAttempt(false);

    if (activeTopic) {
      // Load existing progress for this topic from database
      const existingProgress = progressMap.get(activeTopic.id);
      if (existingProgress?.videoWatched) {
        setVideoCompleted(true);
        setVideoProgress(existingProgress.videoProgress || 100);
      }

      // Check if quiz exists and load quiz performance/attempt status
      if (activeTopic.quiz) {
        checkQuizAttempt(activeTopic.id);
      }

      // Expand the section containing this topic
      const section = sections.find((s) => s.topics.some((t) => t.id === activeTopic.id));
      if (section && !expandedSections.has(section.name)) {
        setExpandedSections((prev) => new Set([...prev, section.name]));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTopic?.id, enrollment?.id]);

  const checkQuizAttempt = async (topicId: string) => {
    setIsLoadingQuizPerformance(true);
    try {
      const response = await fetch(`/api/topics/${topicId}/quiz-attempt`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.attempt) {
          setHasQuizAttempt(true);
          const correctCount = Object.values(data.attempt.answers as Record<string, number>).filter(
            (answer, index) => {
              const question = data.quiz.questions[index];
              return question && answer === question.correctAnswer;
            }
          ).length;

          setQuizPerformance({
            score: data.attempt.score,
            passed: data.attempt.passed,
            correctCount,
            totalQuestions: data.quiz.questions.length,
            completedAt: data.attempt.completedAt,
          });
        } else {
          setHasQuizAttempt(false);
        }
      } else {
        setHasQuizAttempt(false);
      }
    } catch (error) {
      console.error("Failed to check quiz attempt:", error);
      setHasQuizAttempt(false);
    } finally {
      setIsLoadingQuizPerformance(false);
    }
  };

  const currentQuiz = activeTopic?.quiz || generatedQuiz;

  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress);
  };

  const handleVideoComplete = async () => {
    if (!activeTopic || !enrollment || videoCompleted) return;
    setVideoCompleted(true);

    setLocalProgress((prev) => {
      const newMap = new Map(prev);
      newMap.set(activeTopic.id, {
        isCompleted: false,
        videoWatched: true,
        videoProgress: 100,
      });
      return newMap;
    });
  };

  const handleTakeQuiz = async () => {
    if (!activeTopic || !enrollment) return;

    if (activeTopic.quiz || generatedQuiz) {
      setShowQuizModal(true);
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      const response = await fetch(`/api/topics/${activeTopic.id}/generate-quiz`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();

        if (data.quiz || data.quizId) {
          const quizResponse = await fetch(`/api/topics/${activeTopic.id}/quiz`);
          if (quizResponse.ok) {
            const quizData = await quizResponse.json();
            if (quizData.quiz) {
              setGeneratedQuiz(quizData.quiz);
              setShowQuizModal(true);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to generate quiz:", error);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleQuizComplete = async (passed: boolean) => {
    if (!passed || !activeTopic || !enrollment) return;

    try {
      // Update topic progress in database
      const progressResponse = await fetch(`/api/courses/${course.slug}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: activeTopic.id,
          enrollmentId: enrollment.id,
          videoProgress: 100,
          videoWatched: true,
          isCompleted: true,
        }),
      });

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        // Update enrollment progress in local state
        setEnrollment((prev) =>
          prev
            ? {
                ...prev,
                progress: progressData.data.overallProgress,
                status: progressData.data.isCompleted ? "COMPLETED" : "ACTIVE",
                completedAt: progressData.data.isCompleted ? new Date() : null,
              }
            : null
        );
      } else {
        console.error("Failed to update topic progress");
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }

    // Update local progress immediately for UI responsiveness
    setLocalProgress((prev) => {
      const newMap = new Map(prev);
      newMap.set(activeTopic.id, {
        isCompleted: true,
        videoWatched: true,
        videoProgress: 100,
      });
      return newMap;
    });

    // Close quiz modal immediately
    setShowQuizModal(false);

    // Clear all video/quiz state for smooth transition
    setVideoProgress(0);
    setVideoCompleted(false);
    setGeneratedQuiz(null);
    setIsGeneratingQuiz(false);

    const nextTopic = getNextTopic(activeTopic.id);

    setTimeout(() => {
      if (nextTopic) {
        // Expand the section containing the next topic
        const nextSection = sections.find((s) => s.topics.some((t) => t.id === nextTopic.id));
        if (nextSection) {
          setExpandedSections((prev) => new Set([...prev, nextSection.name]));
        }

        // Clear state again before setting new topic (double-clear for safety)
        setVideoProgress(0);
        setVideoCompleted(false);
        setGeneratedQuiz(null);
        setIsGeneratingQuiz(false);
        setShowQuizModal(false);

        // Set the new active topic - this will trigger useEffect to load its progress
        setActiveTopic(nextTopic);
      } else if (isLastTopic) {
        router.push(`/courses/${course.slug}/exam`);
      }

      // Refresh to sync with server
      router.refresh();
    }, 800);
  };

  return (
    <div className="-mx-4 -mt-4 flex h-[calc(100vh-4rem)] flex-col sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 xl:-mx-10 xl:-mt-10">
      {/* Top Bar */}
      <div className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 shrink-0 border-b px-2 py-2 backdrop-blur sm:px-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-3">
            <Link
              href="/courses"
              className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded-lg p-1.5 transition-colors sm:p-2"
              title="Back to Courses"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>

            <div className="bg-border h-4 w-px shrink-0 sm:h-6" />

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded-lg p-1.5 transition-colors sm:p-2"
              title={sidebarCollapsed ? "Show course outline" : "Hide course outline"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <PanelLeftClose className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>

            <div className="hidden min-w-0 sm:block">
              <h1 className="text-foreground line-clamp-1 truncate text-xs font-semibold sm:text-sm">
                {course.title}
              </h1>
              <p className="text-muted-foreground text-[10px] sm:text-xs">
                {course.topics.length} Topics • {course.duration}h
              </p>
            </div>
          </div>

          {isEnrolled && (
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <div className="hidden items-center gap-2 sm:gap-3 lg:flex">
                <span className="text-muted-foreground text-xs font-medium">Progress</span>
                <div className="flex items-center gap-2">
                  <div className="bg-secondary h-2 w-20 overflow-hidden rounded-full sm:w-28">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${calculateOverallProgress()}%` }}
                    />
                  </div>
                  <span className="text-primary min-w-8 text-xs font-semibold sm:min-w-10">
                    {Math.round(calculateOverallProgress())}%
                  </span>
                </div>
              </div>

              {canTakeExam() && (
                <Link href={`/courses/${course.slug}/exam`}>
                  <Button
                    size="sm"
                    className="text-xs sm:text-sm"
                    leftIcon={<Award className="h-3 w-3 sm:h-4 sm:w-4" />}
                  >
                    <span className="hidden sm:inline">Take Exam</span>
                    <span className="sm:hidden">Exam</span>
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Mobile Overlay */}
        {!sidebarCollapsed && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Collapsible Sidebar */}
        <div
          className={`border-border bg-card shrink-0 overflow-hidden border-r transition-all duration-300 ${
            sidebarCollapsed
              ? "w-0 -translate-x-full md:translate-x-0"
              : "w-full translate-x-0 md:w-80"
          } fixed z-50 h-full md:relative md:z-auto`}
        >
          <div className="flex h-full w-full flex-col md:w-80">
            {/* Enrollment Status (if not enrolled) */}
            {!isEnrolled && (
              <div className="border-border bg-muted/30 border-b p-4">
                <div className="space-y-3 text-center">
                  <Mascot size="sm" mood="waving" animate={false} />
                  <div>
                    <p className="text-sm font-semibold">Ready to start?</p>
                    <p className="text-muted-foreground text-xs">Enroll to track progress</p>
                  </div>
                  <Button size="sm" fullWidth onClick={handleEnroll} isLoading={isEnrolling}>
                    Enroll Now
                  </Button>
                </div>
              </div>
            )}

            {/* Course Sections */}
            <div className="flex-1 overflow-y-auto">
              {sections.map((section) => {
                const { completed, total } = getSectionProgress(section);
                const isExpanded = expandedSections.has(section.name);
                const isSectionComplete = completed === total;

                return (
                  <div key={section.name} className="border-border border-b last:border-b-0">
                    <button
                      onClick={() => toggleSection(section.name)}
                      className="hover:bg-muted/50 flex w-full items-center justify-between p-3 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                            isSectionComplete
                              ? "bg-success text-white"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {isSectionComplete ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <BookOpen className="h-2.5 w-2.5" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-foreground text-sm font-medium">{section.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {completed}/{total}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`text-muted-foreground h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="bg-muted/20">
                        {section.topics.map((topic) => {
                          const globalIndex = getGlobalTopicIndex(topic.id);
                          const status = getTopicStatus(topic, globalIndex);
                          const isActive = activeTopic?.id === topic.id;

                          return (
                            <button
                              key={topic.id}
                              onClick={() => status !== "locked" && setActiveTopic(topic)}
                              disabled={status === "locked"}
                              className={`flex w-full items-center gap-2 py-2.5 pr-3 pl-10 text-left transition-all ${
                                isActive
                                  ? "bg-primary/10 border-primary border-l-2"
                                  : "hover:bg-muted/50"
                              } ${status === "locked" ? "cursor-not-allowed opacity-50" : ""}`}
                            >
                              <div
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                                  status === "completed"
                                    ? "bg-success text-white"
                                    : status === "available"
                                      ? "bg-primary text-white"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {status === "completed" ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : status === "locked" ? (
                                  <Lock className="h-3 w-3" />
                                ) : (
                                  <span className="text-[10px] font-medium">{globalIndex + 1}</span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`truncate text-xs ${isActive ? "text-primary font-medium" : "text-foreground"}`}
                                >
                                  {topic.title}
                                </p>
                                <p className="text-muted-foreground flex items-center gap-1 text-[10px]">
                                  <Clock className="h-2.5 w-2.5" />
                                  {topic.duration}min
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-muted/30 w-full flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl p-2 sm:p-3 lg:p-4">
            {activeTopic ? (
              <div className="space-y-3">
                {/* Topic Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:gap-2 sm:text-xs">
                    <span className="bg-primary/10 text-primary max-w-[140px] truncate rounded-md px-1.5 py-0.5 font-medium sm:max-w-none sm:px-2 sm:py-1">
                      {sections.find((s) => s.topics.some((t) => t.id === activeTopic.id))?.name}
                    </span>
                    <ChevronRight className="text-muted-foreground h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                    <span className="text-muted-foreground whitespace-nowrap">
                      Topic {getGlobalTopicIndex(activeTopic.id) + 1} of {course.topics.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-foreground text-lg font-bold break-words sm:text-xl">
                    {activeTopic.title}
                  </h2>
                  {activeTopic.description && (
                    <p className="text-muted-foreground text-xs break-words sm:text-sm">
                      {activeTopic.description}
                    </p>
                  )}
                </div>

                {/* YouTube Video Player */}
                {activeTopic.videoUrl && (
                  <YouTubePlayer
                    videoUrl={activeTopic.videoUrl}
                    topicId={activeTopic.id}
                    topicTitle={activeTopic.title}
                    topicDescription={activeTopic.description || undefined}
                    courseSlug={course.slug}
                    enrollmentId={enrollment?.id || ""}
                    initialProgress={progressMap.get(activeTopic.id)?.videoProgress || 0}
                    onProgressUpdate={handleVideoProgress}
                    onComplete={handleVideoComplete}
                    disableProgressUpdate={progressMap.get(activeTopic.id)?.isCompleted || false}
                  />
                )}

                {/* Quiz Section */}
                <Card className="border-2 p-1.5 sm:p-2">
                  <CardContent className="p-3 sm:p-5">
                    {!videoCompleted && !progressMap.get(activeTopic.id)?.videoWatched ? (
                      <div className="flex items-center justify-between gap-2 sm:gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                          <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10">
                            <Play className="text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-foreground text-sm font-medium sm:text-base">
                              Video Required
                            </p>
                            <p className="text-muted-foreground text-xs sm:text-sm">
                              Watch 100% of the video to unlock the quiz
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <Lock className="text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                      </div>
                    ) : progressMap.get(activeTopic.id)?.isCompleted ? (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                            <div className="bg-success/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10">
                              <CheckCircle2 className="text-success h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-success text-sm font-medium sm:text-base">
                                Topic Completed!
                              </p>
                              <p className="text-muted-foreground text-xs sm:text-sm">
                                Great work! You&apos;ve mastered this topic
                              </p>
                            </div>
                          </div>
                          <div className="w-full shrink-0 sm:w-auto">
                            {!isLastTopic ? (
                              <Button
                                size="sm"
                                fullWidth
                                className="sm:w-auto"
                                onClick={() => {
                                  const nextTopic = getNextTopic(activeTopic.id);
                                  if (nextTopic) setActiveTopic(nextTopic);
                                }}
                                rightIcon={<ChevronRight className="h-4 w-4" />}
                              >
                                Next Topic
                              </Button>
                            ) : (
                              <Link
                                href={`/courses/${course.slug}/exam`}
                                className="block w-full sm:w-auto"
                              >
                                <Button
                                  size="sm"
                                  fullWidth
                                  className="sm:w-auto"
                                  leftIcon={<Award className="h-4 w-4" />}
                                >
                                  Take Exam
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Quiz Performance Overview */}
                        {activeTopic.quiz && (
                          <div className="border-border border-t pt-4">
                            {isLoadingQuizPerformance ? (
                              <div className="text-muted-foreground flex items-center gap-3 text-sm">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading quiz performance...</span>
                              </div>
                            ) : quizPerformance ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-foreground text-sm font-semibold">
                                    Quiz Performance
                                  </h4>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowQuizModal(true)}
                                  >
                                    View Details
                                  </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="bg-muted/50 rounded-lg p-3">
                                    <p className="text-muted-foreground mb-1 text-xs">Score</p>
                                    <p
                                      className={`text-lg font-bold ${quizPerformance.passed ? "text-success" : "text-destructive"}`}
                                    >
                                      {Math.round(quizPerformance.score)}%
                                    </p>
                                  </div>
                                  <div className="bg-muted/50 rounded-lg p-3">
                                    <p className="text-muted-foreground mb-1 text-xs">Correct</p>
                                    <p className="text-foreground text-lg font-bold">
                                      {quizPerformance.correctCount}/
                                      {quizPerformance.totalQuestions}
                                    </p>
                                  </div>
                                  <div className="bg-muted/50 rounded-lg p-3">
                                    <p className="text-muted-foreground mb-1 text-xs">Status</p>
                                    <p
                                      className={`text-sm font-semibold ${quizPerformance.passed ? "text-success" : "text-destructive"}`}
                                    >
                                      {quizPerformance.passed ? "Passed" : "Failed"}
                                    </p>
                                  </div>
                                </div>
                                {quizPerformance.completedAt && (
                                  <p className="text-muted-foreground text-xs">
                                    Completed on{" "}
                                    {new Date(quizPerformance.completedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-sm">No quiz attempt found</p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : currentQuiz && !isGeneratingQuiz ? (
                      hasQuizAttempt ? (
                        <div className="space-y-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                              <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10">
                                <Award className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-foreground text-sm font-medium sm:text-base">
                                  Quiz Completed
                                </p>
                                <p className="text-muted-foreground text-xs sm:text-sm">
                                  View your quiz results
                                </p>
                              </div>
                            </div>
                            <div className="w-full shrink-0 sm:w-auto">
                              <Button
                                onClick={() => setShowQuizModal(true)}
                                variant="outline"
                                fullWidth
                                className="sm:w-auto"
                                leftIcon={<Award className="h-4 w-4" />}
                              >
                                View Results
                              </Button>
                            </div>
                          </div>

                          {/* Quiz Performance Overview */}
                          {quizPerformance && (
                            <div className="border-border border-t pt-4">
                              <div className="space-y-3">
                                <h4 className="text-foreground text-sm font-semibold">
                                  Your Performance
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="bg-muted/50 rounded-lg p-3">
                                    <p className="text-muted-foreground mb-1 text-xs">Score</p>
                                    <p
                                      className={`text-lg font-bold ${quizPerformance.passed ? "text-success" : "text-destructive"}`}
                                    >
                                      {Math.round(quizPerformance.score)}%
                                    </p>
                                  </div>
                                  <div className="bg-muted/50 rounded-lg p-3">
                                    <p className="text-muted-foreground mb-1 text-xs">Correct</p>
                                    <p className="text-foreground text-lg font-bold">
                                      {quizPerformance.correctCount}/
                                      {quizPerformance.totalQuestions}
                                    </p>
                                  </div>
                                  <div className="bg-muted/50 rounded-lg p-3">
                                    <p className="text-muted-foreground mb-1 text-xs">Status</p>
                                    <p
                                      className={`text-sm font-semibold ${quizPerformance.passed ? "text-success" : "text-destructive"}`}
                                    >
                                      {quizPerformance.passed ? "Passed" : "Failed"}
                                    </p>
                                  </div>
                                </div>
                                {quizPerformance.completedAt && (
                                  <p className="text-muted-foreground text-xs">
                                    Completed on{" "}
                                    {new Date(quizPerformance.completedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                            <div className="bg-success/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10">
                              <CheckCircle2 className="text-success h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-foreground text-sm font-medium sm:text-base">
                                Quiz Ready!
                              </p>
                              <p className="text-muted-foreground text-xs sm:text-sm">
                                Test your knowledge on this topic
                              </p>
                            </div>
                          </div>
                          <div className="w-full shrink-0 sm:w-auto">
                            <Button
                              onClick={() => setShowQuizModal(true)}
                              fullWidth
                              className="sm:w-auto"
                              leftIcon={<Award className="h-4 w-4" />}
                            >
                              Take Quiz
                            </Button>
                          </div>
                        </div>
                      )
                    ) : isGeneratingQuiz ? (
                      <div className="flex items-center justify-between gap-2 sm:gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                          <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10">
                            <Loader2 className="text-primary h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-foreground text-sm font-medium sm:text-base">
                              Generating Quiz...
                            </p>
                            <p className="text-muted-foreground text-xs sm:text-sm">
                              Creating questions from video content
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <div className="bg-muted text-muted-foreground rounded-lg px-2 py-1.5 text-xs font-medium whitespace-nowrap sm:px-4 sm:py-2 sm:text-sm">
                            Please wait
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                          <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10">
                            <Award className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-foreground text-sm font-medium sm:text-base">
                              Ready for Quiz?
                            </p>
                            <p className="text-muted-foreground text-xs sm:text-sm">
                              Test your understanding of this topic
                            </p>
                          </div>
                        </div>
                        <div className="w-full shrink-0 sm:w-auto">
                          <Button
                            onClick={handleTakeQuiz}
                            fullWidth
                            className="sm:w-auto"
                            leftIcon={<Award className="h-4 w-4" />}
                          >
                            Take Quiz
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quiz Modal */}
                {currentQuiz && (
                  <QuizModal
                    isOpen={showQuizModal}
                    onClose={() => setShowQuizModal(false)}
                    quiz={currentQuiz}
                    topicId={activeTopic.id}
                    enrollmentId={enrollment?.id || ""}
                    courseSlug={course.slug}
                    nextTopicId={getNextTopic(activeTopic.id)?.id}
                    isLastTopic={isLastTopic}
                    onQuizComplete={handleQuizComplete}
                    isTopicCompleted={progressMap.get(activeTopic.id)?.isCompleted || false}
                    hasQuizAttempt={hasQuizAttempt}
                  />
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center py-16">
                <div className="max-w-sm text-center">
                  <div className="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
                    <BookOpen className="text-primary h-8 w-8" />
                  </div>
                  <h3 className="text-foreground text-lg font-semibold">Select a Topic to Begin</h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {sidebarCollapsed ? (
                      <>
                        Click the{" "}
                        <button
                          onClick={() => setSidebarCollapsed(false)}
                          className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
                        >
                          <PanelLeft className="h-4 w-4" />
                          sidebar toggle
                        </button>{" "}
                        to view course topics
                      </>
                    ) : (
                      "Choose a topic from the course outline on the left to start learning"
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
