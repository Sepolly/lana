"use client"

import * as React from "react";
import { Button, Progress, Mascot } from "@/components/ui";
import { X, CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy, Loader2 } from "lucide-react";
import type { Quiz, QuizQuestion } from "@prisma/client";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz & { questions: QuizQuestion[] };
  topicId: string;
  enrollmentId: string;
  courseSlug: string;
  nextTopicId?: string;
  isLastTopic: boolean;
  onQuizComplete: (passed: boolean) => void;
  isTopicCompleted?: boolean; // If true, show performance view instead of allowing retake
  hasQuizAttempt?: boolean; // If true, user has already taken the quiz - show results only
}

export function QuizModal({
  isOpen,
  onClose,
  quiz,
  topicId,
  enrollmentId,
  courseSlug,
  nextTopicId,
  isLastTopic,
  onQuizComplete,
  isTopicCompleted = false,
  hasQuizAttempt = false,
}: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showExplanation, setShowExplanation] = React.useState(false);
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(null);
  const [result, setResult] = React.useState<{
    score: number;
    passed: boolean;
    feedback: Array<{
      questionId: string;
      isCorrect: boolean;
      correctAnswer: number;
    }>;
  } | null>(null);
  const [quizAttempt, setQuizAttempt] = React.useState<{
    score: number;
    passed: boolean;
    answers: Record<string, number>;
    completedAt: string;
  } | null>(null);
  const [isLoadingAttempt, setIsLoadingAttempt] = React.useState(false);

  const questionRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const question = quiz.questions[currentQuestion];
  const options = question?.options as string[];
  const totalQuestions = quiz.questions.length;

  // Check if element is visible in viewport
  const isElementVisible = (element: HTMLElement | null, container: HTMLElement | null): boolean => {
    if (!element || !container) return false;
    
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Check if element is within container's visible area
    return (
      elementRect.top >= containerRect.top &&
      elementRect.bottom <= containerRect.bottom
    );
  };

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (isTopicCompleted || hasQuizAttempt) {
        // Load quiz attempt for completed topics or if user has already taken the quiz
        loadQuizAttempt();
      } else {
        setCurrentQuestion(0);
        setAnswers({});
        setResult(null);
        setShowExplanation(false);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setQuizAttempt(null);
      }
    }
  }, [isOpen, isTopicCompleted, hasQuizAttempt, topicId]);

  // Handle scrolling when question changes - only scroll if question is not visible
  React.useEffect(() => {
    if (result || !questionRef.current || !contentRef.current) return;
    
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      if (questionRef.current && contentRef.current) {
        // Only scroll if the question is not fully visible
        if (!isElementVisible(questionRef.current, contentRef.current)) {
          questionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }
    });
  }, [currentQuestion, result]);

  async function loadQuizAttempt() {
    setIsLoadingAttempt(true);
    try {
      const response = await fetch(`/api/topics/${topicId}/quiz-attempt`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.attempt) {
          setQuizAttempt(data.attempt);
          // Convert answers to result format for display
          const feedback: Array<{
            questionId: string;
            isCorrect: boolean;
            correctAnswer: number;
          }> = [];
          
          data.quiz.questions.forEach((q: QuizQuestion) => {
            const userAnswer = data.attempt.answers[q.id];
            feedback.push({
              questionId: q.id,
              isCorrect: userAnswer === q.correctAnswer,
              correctAnswer: q.correctAnswer,
            });
          });
          
          setResult({
            score: Math.round(data.attempt.score),
            passed: data.attempt.passed,
            feedback,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load quiz attempt:", error);
    } finally {
      setIsLoadingAttempt(false);
    }
  }

  if (!isOpen) return null;

  // If topic is completed or user has already taken the quiz, show performance view only
  if (isTopicCompleted || hasQuizAttempt) {
    if (isLoadingAttempt) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Loading quiz performance...</p>
            </div>
          </div>
        </div>
      );
    }

    if (!result || !quizAttempt) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Quiz Performance</h2>
                  <p className="text-sm text-muted-foreground">Topic Completed</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No quiz attempt found</p>
              <Button onClick={onClose} className="mt-4">Close</Button>
            </div>
          </div>
        </div>
      );
    }
  }

  const handleSelectAnswer = (answerIndex: number) => {
    if (showExplanation || isSubmitting) return; // Don't allow changing after showing explanation or during submission
    
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === question.correctAnswer;
    setIsCorrect(correct);
    setShowExplanation(true);
    
    setAnswers((prev) => ({
      ...prev,
      [question.id]: answerIndex,
    }));
  };

  const handleNext = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      // Submit quiz
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    // Prevent submission if user has already taken the quiz
    if (hasQuizAttempt) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          topicId,
          enrollmentId,
          answers,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error("Quiz submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    // Only notify parent when quiz is passed; parent handles navigation/state reset
    if (result?.passed) {
      onQuizComplete(true);
    }
    onClose();
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    setShowExplanation(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={result ? handleContinue : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/20">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isTopicCompleted || hasQuizAttempt ? "Quiz Performance" : "Topic Quiz"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isTopicCompleted || hasQuizAttempt ? (isTopicCompleted ? "Topic Completed" : "View Results") : result ? "Quiz Complete!" : `Question ${currentQuestion + 1} of ${totalQuestions}`}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div ref={contentRef} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] relative">
          {/* Loading Overlay - shown when submitting quiz */}
          {isSubmitting && !isTopicCompleted && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground mb-1">
                    Calculating Your Results
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we grade your quiz...
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {result ? (
            // Results View
            <div className="text-center py-8 space-y-6">
              <Mascot 
                size="lg" 
                mood={result.passed ? "celebrating" : "thinking"} 
                animate={result.passed}
              />
              
              <div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                  result.passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}>
                  {result.passed ? (
                    <>
                      <Trophy className="w-5 h-5" />
                      <span className="font-semibold">Congratulations!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      <span className="font-semibold">Keep Practicing!</span>
                    </>
                  )}
                </div>
                
                <h3 className="text-3xl font-bold text-foreground mb-2">
                  {Math.round(result.score)}%
                </h3>
                <p className="text-muted-foreground">
                  You got {result.feedback.filter(f => f.isCorrect).length} out of {totalQuestions} questions correct
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Passing score: {quiz.passingScore}%
                </p>
              </div>

              {/* Progress visualization */}
              <div className="w-full max-w-xs mx-auto">
                <Progress 
                  value={result.score} 
                  className={`h-3 ${result.passed ? "[&>div]:bg-success" : "[&>div]:bg-destructive"}`}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-4 pt-4">
                {result.passed ? (
                  <Button 
                    onClick={handleContinue}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    size="lg"
                  >
                    {isLastTopic ? "Take Final Exam" : "Next Topic"}
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={onClose}
                    >
                      Review Content
                    </Button>
                    <Button 
                      onClick={handleRetry}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                    >
                      Try Again
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Question View
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <Progress value={((currentQuestion + 1) / totalQuestions) * 100} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(((currentQuestion + 1) / totalQuestions) * 100)}%</span>
                </div>
              </div>

              {/* Question */}
              <div ref={questionRef}>
                <h3 className="text-lg font-semibold text-foreground mb-6">
                  {question.question}
                </h3>
                
                <div className="space-y-3">
                  {options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrectAnswer = index === question.correctAnswer;
                    
                    let buttonClass = "w-full p-4 rounded-xl border-2 text-left transition-all ";
                    
                    if (showExplanation) {
                      if (isCorrectAnswer) {
                        buttonClass += "border-success bg-success/10 ";
                      } else if (isSelected && !isCorrectAnswer) {
                        buttonClass += "border-destructive bg-destructive/10 ";
                      } else {
                        buttonClass += "border-border opacity-50 ";
                      }
                    } else if (isSelected) {
                      buttonClass += "border-primary bg-primary/5 ";
                    } else {
                      buttonClass += "border-border hover:border-primary/50 hover:bg-muted/30 ";
                    }
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleSelectAnswer(index)}
                        disabled={showExplanation || isSubmitting}
                        className={buttonClass}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            showExplanation && isCorrectAnswer
                              ? "border-success bg-success text-white"
                              : showExplanation && isSelected && !isCorrectAnswer
                              ? "border-destructive bg-destructive text-white"
                              : isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-muted-foreground"
                          }`}>
                            {showExplanation && isCorrectAnswer ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : showExplanation && isSelected && !isCorrectAnswer ? (
                              <XCircle className="w-5 h-5" />
                            ) : (
                              <span className="text-sm font-medium">
                                {String.fromCharCode(65 + index)}
                              </span>
                            )}
                          </div>
                          <span className={showExplanation && isCorrectAnswer ? "font-medium" : ""}>
                            {option}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              {showExplanation && question.explanation && (
                <div className={`p-4 rounded-xl ${
                  isCorrect ? "bg-success/10 border border-success/20" : "bg-amber-50 border border-amber-200"
                }`}>
                  <p className="text-sm font-medium mb-1">
                    {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && showExplanation && !isTopicCompleted && (
          <div className="p-6 border-t border-border bg-muted/30 relative">
            {isSubmitting && (
              <div className="absolute inset-0 bg-muted/30 backdrop-blur-sm z-10 rounded-b-2xl" />
            )}
            <Button
              onClick={handleNext}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              {currentQuestion === totalQuestions - 1 ? "See Results" : "Next Question"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

