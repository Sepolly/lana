"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardContent, Button, Mascot } from "@/components/ui";
import { CheckCircle2, Lock, Clock, BookOpen, Award, ChevronRight, ChevronDown, ArrowLeft, Loader2, Play, PanelLeftClose, PanelLeft } from "lucide-react";
import Link from "next/link";
import { QuizModal } from "@/components/quiz-modal";
import type { LearningStyle, Course, Topic, Quiz, QuizQuestion, Enrollment, TopicProgress } from "@prisma/client";

// Dynamic import with SSR disabled to prevent hydration issues with YouTube iframe API
const YouTubePlayer = dynamic(
  () => import("@/components/youtube-player").then((mod) => mod.YouTubePlayer),
  { 
    ssr: false,
    loading: () => (
      <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-secondary/30 border-t-primary animate-spin" />
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

type EnrollmentWithProgress = Enrollment & {
  topicProgress: TopicProgress[];
} | null;

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
  const defaultSections = ["Introduction & Foundations", "Core Fundamentals", "Intermediate Skills", "Advanced & Professional", "Career Launch"];
  
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
  defaultSections.forEach(sectionName => {
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

export function CourseContent({ course, enrollment: initialEnrollment, userId, learningStyle }: CourseContentProps) {
  const router = useRouter();
  const [enrollment, setEnrollment] = React.useState(initialEnrollment);
  const [isEnrolling, setIsEnrolling] = React.useState(false);
  const [activeTopic, setActiveTopic] = React.useState<TopicWithQuiz | null>(null);
  const [showQuizModal, setShowQuizModal] = React.useState(false);
  const [videoProgress, setVideoProgress] = React.useState(0);
  const [videoCompleted, setVideoCompleted] = React.useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = React.useState(false);
  const [generatedQuiz, setGeneratedQuiz] = React.useState<(Quiz & { questions: QuizQuestion[] }) | null>(null);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(["Introduction & Foundations", "Core Fundamentals"]));
  const [localProgress, setLocalProgress] = React.useState<Map<string, { isCompleted: boolean; videoWatched: boolean; videoProgress: number }>>(new Map());
  
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
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const isEnrolled = !!enrollment;
  
  // Merge server progress with local progress for immediate UI updates
  const progressMap = React.useMemo(() => {
    const map = new Map(
      enrollment?.topicProgress.map((p) => [p.topicId, p]) || []
    );
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
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  const getTopicStatus = (topic: TopicWithQuiz, topicIndex: number): "completed" | "available" | "locked" => {
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
    section.topics.forEach(topic => {
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
    return course.topics.findIndex(t => t.id === topicId);
  };

  const getNextTopic = (currentTopicId: string): TopicWithQuiz | null => {
    const currentIndex = course.topics.findIndex(t => t.id === currentTopicId);
    if (currentIndex >= 0 && currentIndex < course.topics.length - 1) {
      return course.topics[currentIndex + 1];
    }
    return null;
  };
  
  const isLastTopic = activeTopic ? 
    course.topics.findIndex(t => t.id === activeTopic.id) === course.topics.length - 1 : false;

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
      const section = sections.find(s => s.topics.some(t => t.id === activeTopic.id));
      if (section && !expandedSections.has(section.name)) {
        setExpandedSections(prev => new Set([...prev, section.name]));
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
    
    setLocalProgress(prev => {
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
      const response = await fetch(`/api/topics/${activeTopic.id}/generate-quiz`, { method: "POST" });
      
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
        setEnrollment(prev => prev ? {
          ...prev,
          progress: progressData.data.overallProgress,
          status: progressData.data.isCompleted ? "COMPLETED" : "ACTIVE",
          completedAt: progressData.data.isCompleted ? new Date() : null,
        } : null);
      } else {
        console.error("Failed to update topic progress");
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }

    // Update local progress immediately for UI responsiveness
    setLocalProgress(prev => {
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
        const nextSection = sections.find(s => s.topics.some(t => t.id === nextTopic.id));
        if (nextSection) {
          setExpandedSections(prev => new Set([...prev, nextSection.name]));
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
    <div className="h-[calc(100vh-4rem)] flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 -mt-4 sm:-mt-6 lg:-mt-8 xl:-mt-10">
      {/* Top Bar */}
      <div className="shrink-0 px-4 py-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/courses" 
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Back to Courses"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            <div className="h-6 w-px bg-border" />
            
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={sidebarCollapsed ? "Show course outline" : "Hide course outline"}
            >
              {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            
            <div className="hidden md:block">
              <h1 className="font-semibold text-foreground line-clamp-1 text-sm">{course.title}</h1>
              <p className="text-xs text-muted-foreground">
                {course.topics.length} Topics • {course.duration}h
              </p>
            </div>
          </div>
          
          {isEnrolled && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-medium">Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-28 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${calculateOverallProgress()}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-primary min-w-10">{Math.round(calculateOverallProgress())}%</span>
                </div>
              </div>
              
              {canTakeExam() && (
                <Link href={`/courses/${course.slug}/exam`}>
                  <Button size="sm" leftIcon={<Award className="w-4 h-4" />}>
                    Take Exam
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <div 
          className={`shrink-0 border-r border-border bg-card transition-all duration-300 overflow-hidden ${
            sidebarCollapsed ? 'w-0' : 'w-80'
          }`}
        >
          <div className="w-80 h-full flex flex-col">
            {/* Enrollment Status (if not enrolled) */}
            {!isEnrolled && (
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="text-center space-y-3">
                  <Mascot size="sm" mood="waving" animate={false} />
                  <div>
                    <p className="font-semibold text-sm">Ready to start?</p>
                    <p className="text-xs text-muted-foreground">Enroll to track progress</p>
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
                  <div key={section.name} className="border-b border-border last:border-b-0">
                    <button
                      onClick={() => toggleSection(section.name)}
                      className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          isSectionComplete ? 'bg-success text-white' : 'bg-primary/10 text-primary'
                        }`}>
                          {isSectionComplete ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <BookOpen className="w-2.5 h-2.5" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground text-sm">{section.name}</p>
                          <p className="text-xs text-muted-foreground">{completed}/{total}</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                              className={`w-full pl-10 pr-3 py-2.5 text-left transition-all flex items-center gap-2 ${
                                isActive ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-muted/50"
                              } ${status === "locked" ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs ${
                                status === "completed" ? "bg-success text-white" :
                                status === "available" ? "bg-primary text-white" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {status === "completed" ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : status === "locked" ? (
                                  <Lock className="w-3 h-3" />
                                ) : (
                                  <span className="font-medium text-[10px]">{globalIndex + 1}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs truncate ${isActive ? "text-primary font-medium" : "text-foreground"}`}>
                                  {topic.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
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
        <div className="flex-1 overflow-y-auto bg-muted/30">
          <div className="p-3 lg:p-4 max-w-5xl mx-auto">
            {activeTopic ? (
              <div className="space-y-3">
                {/* Topic Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                      {sections.find(s => s.topics.some(t => t.id === activeTopic.id))?.name}
                    </span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Topic {getGlobalTopicIndex(activeTopic.id) + 1} of {course.topics.length}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-foreground">{activeTopic.title}</h2>
                  {activeTopic.description && (
                    <p className="text-sm text-muted-foreground">{activeTopic.description}</p>
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
                <Card className="border-2 p-2">
                  <CardContent className="p-5">
                    {!videoCompleted && !progressMap.get(activeTopic.id)?.videoWatched ? (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Play className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Video Required</p>
                            <p className="text-sm text-muted-foreground">Watch 100% of the video to unlock the quiz</p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    ) : progressMap.get(activeTopic.id)?.isCompleted ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-5 h-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium text-success">Topic Completed!</p>
                              <p className="text-sm text-muted-foreground">Great work! You&apos;ve mastered this topic</p>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {!isLastTopic ? (
                              <Button 
                                size="sm"
                                onClick={() => {
                                  const nextTopic = getNextTopic(activeTopic.id);
                                  if (nextTopic) setActiveTopic(nextTopic);
                                }}
                                rightIcon={<ChevronRight className="w-4 h-4" />}
                              >
                                Next Topic
                              </Button>
                            ) : (
                              <Link href={`/courses/${course.slug}/exam`}>
                                <Button size="sm" leftIcon={<Award className="w-4 h-4" />}>Take Exam</Button>
                              </Link>
                            )}
                          </div>
                        </div>
                        
                        {/* Quiz Performance Overview */}
                        {activeTopic.quiz && (
                          <div className="pt-4 border-t border-border">
                            {isLoadingQuizPerformance ? (
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Loading quiz performance...</span>
                              </div>
                            ) : quizPerformance ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-foreground">Quiz Performance</h4>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowQuizModal(true)}
                                  >
                                    View Details
                                  </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground mb-1">Score</p>
                                    <p className={`text-lg font-bold ${quizPerformance.passed ? 'text-success' : 'text-destructive'}`}>
                                      {Math.round(quizPerformance.score)}%
                                    </p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground mb-1">Correct</p>
                                    <p className="text-lg font-bold text-foreground">
                                      {quizPerformance.correctCount}/{quizPerformance.totalQuestions}
                                    </p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                                    <p className={`text-sm font-semibold ${quizPerformance.passed ? 'text-success' : 'text-destructive'}`}>
                                      {quizPerformance.passed ? 'Passed' : 'Failed'}
                                    </p>
                                  </div>
                                </div>
                                {quizPerformance.completedAt && (
                                  <p className="text-xs text-muted-foreground">
                                    Completed on {new Date(quizPerformance.completedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No quiz attempt found</p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : currentQuiz && !isGeneratingQuiz ? (
                      hasQuizAttempt ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Award className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">Quiz Completed</p>
                                <p className="text-sm text-muted-foreground">View your quiz results</p>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <Button 
                                onClick={() => setShowQuizModal(true)} 
                                variant="outline"
                                leftIcon={<Award className="w-4 h-4" />}
                              >
                                View Results
                              </Button>
                            </div>
                          </div>
                          
                          {/* Quiz Performance Overview */}
                          {quizPerformance && (
                            <div className="pt-4 border-t border-border">
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-foreground">Your Performance</h4>
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground mb-1">Score</p>
                                    <p className={`text-lg font-bold ${quizPerformance.passed ? 'text-success' : 'text-destructive'}`}>
                                      {Math.round(quizPerformance.score)}%
                                    </p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground mb-1">Correct</p>
                                    <p className="text-lg font-bold text-foreground">
                                      {quizPerformance.correctCount}/{quizPerformance.totalQuestions}
                                    </p>
                                  </div>
                                  <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                                    <p className={`text-sm font-semibold ${quizPerformance.passed ? 'text-success' : 'text-destructive'}`}>
                                      {quizPerformance.passed ? 'Passed' : 'Failed'}
                                    </p>
                                  </div>
                                </div>
                                {quizPerformance.completedAt && (
                                  <p className="text-xs text-muted-foreground">
                                    Completed on {new Date(quizPerformance.completedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-5 h-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Quiz Ready!</p>
                              <p className="text-sm text-muted-foreground">Test your knowledge on this topic</p>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <Button onClick={() => setShowQuizModal(true)} leftIcon={<Award className="w-4 h-4" />}>
                              Take Quiz
                            </Button>
                          </div>
                        </div>
                      )
                    ) : isGeneratingQuiz ? (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Generating Quiz...</p>
                            <p className="text-sm text-muted-foreground">Creating questions from video content</p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <div className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium">
                            Please wait
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Award className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Ready for Quiz?</p>
                            <p className="text-sm text-muted-foreground">Test your understanding of this topic</p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <Button onClick={handleTakeQuiz} leftIcon={<Award className="w-4 h-4" />}>
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
              <div className="h-full flex items-center justify-center py-16">
                <div className="text-center max-w-sm">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Select a Topic to Begin</h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {sidebarCollapsed ? (
                      <>
                        Click the{" "}
                        <button 
                          onClick={() => setSidebarCollapsed(false)}
                          className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <PanelLeft className="w-4 h-4" />
                          sidebar toggle
                        </button>
                        {" "}to view course topics
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
