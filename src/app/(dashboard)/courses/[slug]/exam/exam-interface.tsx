"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Progress, Mascot } from "@/components/ui";
import { ArrowLeft, Clock, Award, CheckCircle2, XCircle, AlertTriangle, Calendar, Play, Download } from "lucide-react";
import type { Course, ExamSchedule, Certificate } from "@prisma/client";

interface ExamInterfaceProps {
  course: Course;
  existingExam: ExamSchedule | null;
  certificate: Certificate | null;
  userId: string;
}

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
}

export function ExamInterface({ course, existingExam, certificate, userId }: ExamInterfaceProps) {
  const router = useRouter();
  const [exam, setExam] = React.useState<ExamSchedule | null>(existingExam);
  const [questions, setQuestions] = React.useState<ExamQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
    certificate?: Certificate;
  } | null>(null);

  // Debug: log exam state on mount and changes
  React.useEffect(() => {
    console.log('ExamInterface debug:', {
      hasExistingExam: !!existingExam,
      existingExamStatus: existingExam?.status,
      existingExamId: existingExam?.id,
      currentExamState: exam?.status,
      certificateExists: !!certificate
    });
  }, [existingExam, exam, certificate]);

  // Timer effect
  React.useEffect(() => {
    if (exam?.status === "IN_PROGRESS" && exam.startedAt) {
      const endTime = new Date(exam.startedAt).getTime() + exam.duration * 60 * 1000;
      
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          handleSubmit();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [exam?.status, exam?.startedAt, exam?.duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const generateCertificate = async () => {
    if (!exam) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/exams/${exam.id}/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh the page to show the new certificate
        window.location.reload();
      } else {
        setError(data.error || "Failed to generate certificate. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.");
      console.error("Certificate generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleExam = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Schedule exam for now
      const response = await fetch("/api/exams/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          scheduledAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Exam scheduled successfully:', data.data);
        setExam(data.data);
      } else {
        // Display the error message from the API
        setError(data.error || "Failed to schedule exam. Please try again.");
        console.error("Schedule error:", data.error);
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.");
      console.error("Schedule error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startExam = async () => {
    if (!exam) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/exams/${exam.id}/start`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setExam(data.data);
        setQuestions(data.data.questions);
        setTimeLeft(data.data.duration * 60);
      }
    } catch (error) {
      console.error("Start error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (!questions[currentQuestion]) return;
    
    setAnswers((prev) => ({
      ...prev,
      [questions[currentQuestion].id]: answerIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!exam) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/exams/${exam.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult({
          score: data.data.score,
          passed: data.data.passed,
          correctCount: data.data.correctCount,
          totalQuestions: data.data.totalQuestions,
          certificate: data.data.certificate,
        });
        setExam(data.data.exam);
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Already has certificate
  if (certificate) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href={`/courses/${course.slug}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </Link>

        <Card className="text-center">
          <CardContent className="py-12">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">You&apos;re Certified!</h1>
            <p className="text-muted-foreground mt-2">
              You&apos;ve already earned a certificate for this course.
            </p>
            
            <div className="mt-6 p-6 bg-gradient-to-br from-primary to-primary/80 rounded-xl text-white">
              <p className="text-sm opacity-80">Certificate Level</p>
              <p className="text-3xl font-bold">{certificate.level}</p>
              <p className="text-sm opacity-80 mt-2">Score: {certificate.examScore}%</p>
              <p className="text-xs opacity-60 mt-4">
                Certificate #{certificate.certificateNumber}
              </p>
            </div>

            <div className="flex gap-4 justify-center mt-6">
              <Link href="/certificates">
                <Button leftIcon={<Award className="w-4 h-4" />}>
                  View Certificates
                </Button>
              </Link>
              <Link href="/courses">
                <Button variant="outline">
                  More Courses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show result
  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center">
          <CardContent className="py-12">
            <Mascot 
              size="xl" 
              mood={result.passed ? "celebrating" : "thinking"} 
              animate={true} 
            />
            
            <h1 className={`text-3xl font-bold mt-6 ${result.passed ? "text-success" : "text-destructive"}`}>
              {result.passed ? "Congratulations!" : "Keep Trying!"}
            </h1>
            
            <p className="text-muted-foreground mt-2">
              {result.passed 
                ? "You've passed the exam and earned your certificate!" 
                : "You didn't pass this time, but you can try again."}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-3xl font-bold text-foreground">{Math.round(result.score)}%</p>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-3xl font-bold text-foreground">
                  {result.correctCount}/{result.totalQuestions}
                </p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
            </div>

            {result.passed && result.certificate && (
              <div className="mt-6 p-6 bg-gradient-to-br from-primary to-primary/80 rounded-xl text-white">
                <Award className="w-12 h-12 mx-auto mb-3" />
                <p className="text-sm opacity-80">Certificate Earned</p>
                <p className="text-2xl font-bold">{result.certificate.level}</p>
                <p className="text-xs opacity-60 mt-2">
                  #{result.certificate.certificateNumber}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center mt-8">
              {result.passed ? (
                <>
                  <Link href="/certificates">
                    <Button leftIcon={<Award className="w-4 h-4" />}>
                      View Certificate
                    </Button>
                  </Link>
                  <Link href="/courses">
                    <Button variant="outline">
                      More Courses
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button onClick={() => {
                    setExam(null);
                    setResult(null);
                    setQuestions([]);
                    setAnswers({});
                    setCurrentQuestion(0);
                  }}>
                    Try Again
                  </Button>
                  <Link href={`/courses/${course.slug}`}>
                    <Button variant="outline">
                      Review Course
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Exam in progress
  if (exam?.status === "IN_PROGRESS" && questions.length > 0) {
    console.log('Showing exam in progress UI');
    const question = questions[currentQuestion];
    
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header with timer */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{course.title} - Final Exam</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
            timeLeft && timeLeft < 300 ? "bg-destructive text-white" : "bg-muted"
          }`}>
            <Clock className="w-5 h-5" />
            <span className="font-mono text-lg font-bold">
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </span>
          </div>
        </div>

        {/* Progress */}
        <Progress value={((currentQuestion + 1) / questions.length) * 100} />

        {/* Question Card */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-medium text-foreground mb-6">
              {question.question}
            </h2>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    answers[question.id] === index
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      answers[question.id] === index
                        ? "border-primary bg-primary text-white"
                        : "border-muted-foreground"
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          {/* Question indicators */}
          <div className="flex gap-1 flex-wrap justify-center max-w-lg">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  idx === currentQuestion
                    ? "bg-primary text-white"
                    : answers[questions[idx].id] !== undefined
                    ? "bg-success text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={Object.keys(answers).length !== questions.length}
            >
              Submit Exam
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestion((p) => Math.min(questions.length - 1, p + 1))}
            >
              Next
            </Button>
          )}
        </div>

        {/* Warning for unanswered */}
        {Object.keys(answers).length !== questions.length && (
          <div className="flex items-center gap-2 p-3 bg-warning/10 text-warning rounded-xl text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {questions.length - Object.keys(answers).length} question(s) unanswered
            </span>
          </div>
        )}
      </div>
    );
  }

  // Exam completed - show results based on pass/fail
  if (exam?.status === "COMPLETED") {
    console.log('Showing exam completed UI, passed:', exam.passed);
    const passed = exam.passed;
    const score = exam.score || 0;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href={`/courses/${course.slug}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </Link>

        <Card className="text-center">
          <CardContent className="py-12">
            <Mascot size="lg" mood={passed ? "celebrating" : "thinking"} animate={true} />

            <h1 className="text-2xl font-bold text-foreground mt-6">
              Exam Completed
            </h1>
            <p className="text-muted-foreground mt-2">
              {course.title}
            </p>

            <div className="mt-8 p-6 rounded-xl border" style={{
              backgroundColor: passed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderColor: passed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
            }}>
              <div className="flex items-center justify-center gap-2 mb-4">
                {passed ? (
                  <CheckCircle2 className="w-6 h-6 text-success" />
                ) : (
                  <XCircle className="w-6 h-6 text-destructive" />
                )}
                <span className={`text-lg font-semibold ${passed ? 'text-success' : 'text-destructive'}`}>
                  {passed ? 'Passed' : 'Failed'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Your score: <span className={`font-semibold ${passed ? 'text-success' : 'text-destructive'}`}>
                  {Math.round(score)}%
                </span> (Passing threshold: 60%)
              </p>
              <p className="text-sm text-muted-foreground">
                {passed ? (
                  <>Congratulations! You have successfully completed the final exam.
                  {certificate ? " Your certificate is ready." : " Your certificate will be available shortly."}</>
                ) : (
                  <>Don&apos;t worry! You can review the course materials and retake the exam when you&apos;re ready.</>
                )}
              </p>
            </div>

            {passed && certificate && (certificate as Certificate).id && (
              <div className="mt-6">
                <Link href={`/certificate/${(certificate as Certificate).id}`}>
                  <Button leftIcon={<Award className="w-4 h-4" />}>
                    View Certificate
                  </Button>
                </Link>
              </div>
            )}

            {passed && !certificate && (
              <div className="mt-6">
                <Button
                  onClick={generateCertificate}
                  isLoading={isLoading}
                  leftIcon={<Award className="w-4 h-4" />}
                >
                  Generate Certificate
                </Button>
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
              </div>
            )}

            {!passed && (
              <div className="mt-6">
                <Button
                  onClick={() => {
                    // Reset exam state to allow rescheduling
                    setExam(null);
                    setError(null);
                  }}
                  variant="outline"
                >
                  Retake Exam
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Exam scheduled, ready to start
  if (exam?.status === "SCHEDULED") {
    console.log('Showing scheduled exam UI - Start Exam button');
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href={`/courses/${course.slug}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </Link>

        <Card className="text-center">
          <CardContent className="py-12">
            <Mascot size="lg" mood="happy" animate={true} />

            <h1 className="text-2xl font-bold text-foreground mt-6">
              Ready for Your Final Exam?
            </h1>
            <p className="text-muted-foreground mt-2">
              {course.title}
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mt-8">
              <div className="p-4 bg-muted rounded-xl">
                <Clock className="w-6 h-6 mx-auto text-primary mb-2" />
                <p className="font-bold text-foreground">{exam.duration} min</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <Award className="w-6 h-6 mx-auto text-primary mb-2" />
                <p className="font-bold text-foreground">60%</p>
                <p className="text-xs text-muted-foreground">Passing Score</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-warning/10 rounded-xl text-left">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Before you start
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Ensure you have a stable internet connection</li>
                <li>• The timer will start once you begin</li>
                <li>• You cannot pause or restart the exam</li>
                <li>• Answer all questions before submitting</li>
              </ul>
            </div>

            <Button
              size="lg"
              className="mt-8"
              onClick={startExam}
              isLoading={isLoading}
              leftIcon={<Play className="w-5 h-5" />}
            >
              Start Exam Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No exam scheduled - show scheduling screen
  console.log('Showing scheduling UI - no exam found or unexpected status');
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/courses/${course.slug}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Course
      </Link>

      <Card className="text-center">
        <CardContent className="py-12">
          <Mascot size="lg" mood="waving" animate={true} />
          
          <h1 className="text-2xl font-bold text-foreground mt-6">
            Final Exam
          </h1>
          <p className="text-muted-foreground mt-2">
            {course.title}
          </p>

          <p className="text-sm text-muted-foreground mt-6 max-w-md mx-auto">
            Congratulations on completing all the course topics! 
            You&apos;re ready to take the final exam and earn your certificate.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8">
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-2xl font-bold text-primary">20</p>
              <p className="text-xs text-muted-foreground">Questions</p>
            </div>
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-2xl font-bold text-primary">60</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-2xl font-bold text-primary">60%</p>
              <p className="text-xs text-muted-foreground">To Pass</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="mt-8"
            onClick={scheduleExam}
            isLoading={isLoading}
            leftIcon={<Calendar className="w-5 h-5" />}
          >
            Schedule Exam
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

