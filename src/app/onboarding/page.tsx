"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, Button, Mascot, StepProgress } from "@/components/ui";
import {
  ArrowRight,
  ArrowLeft,
  Brain,
  Heart,
  Target,
  Lightbulb,
  GraduationCap,
} from "lucide-react";

// Placeholder questions for the aptitude test (Phase 2 will have full implementation with AI)
const aptitudeQuestions = [
  {
    id: "interests",
    category: "interests",
    question: "What activities do you enjoy most?",
    description: "Select all that apply to you",
    icon: Heart,
    options: [
      { id: "tech", label: "Working with technology and computers", value: "technology" },
      { id: "creative", label: "Creative work (art, design, writing)", value: "creative" },
      { id: "people", label: "Helping and working with people", value: "social" },
      { id: "numbers", label: "Working with numbers and data", value: "analytical" },
      { id: "hands", label: "Building and fixing things", value: "practical" },
      { id: "nature", label: "Working outdoors or with nature", value: "nature" },
    ],
    type: "multiple" as const,
  },
  {
    id: "learning_style",
    category: "learning",
    question: "How do you learn best?",
    description: "Choose your preferred learning method",
    icon: Brain,
    options: [
      { id: "visual", label: "Watching videos, diagrams, and images", value: "VISUAL" },
      { id: "auditory", label: "Listening to explanations and discussions", value: "AUDITORY" },
      { id: "reading", label: "Reading books, articles, and notes", value: "READING_WRITING" },
      { id: "kinesthetic", label: "Hands-on practice and experiments", value: "KINESTHETIC" },
    ],
    type: "single" as const,
  },
  {
    id: "strengths",
    category: "strengths",
    question: "What are your strongest skills?",
    description: "Select your top strengths",
    icon: Target,
    options: [
      { id: "problem", label: "Problem-solving and critical thinking", value: "problem_solving" },
      { id: "comm", label: "Communication and presentation", value: "communication" },
      { id: "leader", label: "Leadership and teamwork", value: "leadership" },
      { id: "detail", label: "Attention to detail and organization", value: "organization" },
      { id: "creative_thinking", label: "Creative and innovative thinking", value: "creativity" },
      { id: "technical", label: "Technical and analytical skills", value: "technical" },
    ],
    type: "multiple" as const,
  },
  {
    id: "goals",
    category: "goals",
    question: "What's most important to you in a career?",
    description: "Choose what matters most",
    icon: Lightbulb,
    options: [
      { id: "money", label: "High salary and financial security", value: "financial" },
      { id: "impact", label: "Making a positive impact on society", value: "impact" },
      { id: "growth", label: "Continuous learning and growth", value: "growth" },
      { id: "balance", label: "Work-life balance and flexibility", value: "balance" },
      { id: "prestige", label: "Recognition and prestige", value: "prestige" },
      { id: "stability", label: "Job security and stability", value: "stability" },
    ],
    type: "multiple" as const,
  },
  {
    id: "education",
    category: "education",
    question: "What's your current education level?",
    description: "Select your education status",
    icon: GraduationCap,
    options: [
      { id: "secondary", label: "Secondary school (JSS/SSS)", value: "secondary" },
      { id: "completed", label: "Completed secondary school", value: "secondary_completed" },
      { id: "vocational", label: "Vocational/Technical training", value: "vocational" },
      { id: "university", label: "Currently in university", value: "university" },
      { id: "graduate", label: "University graduate", value: "graduate" },
    ],
    type: "single" as const,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const currentQuestion = aptitudeQuestions[currentStep];
  const totalSteps = aptitudeQuestions.length;
  const isLastStep = currentStep === totalSteps - 1;

  const handleSelect = (value: string) => {
    if (currentQuestion.type === "single") {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: value,
      }));
    } else {
      const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
      const newAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter((v) => v !== value)
        : [...currentAnswers, value];
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: newAnswers,
      }));
    }
  };

  const isSelected = (value: string) => {
    const answer = answers[currentQuestion.id];
    if (Array.isArray(answer)) {
      return answer.includes(value);
    }
    return answer === value;
  };

  const canProceed = () => {
    const answer = answers[currentQuestion.id];
    if (!answer) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return true;
  };

  const handleNext = async () => {
    if (isLastStep) {
      setIsSubmitting(true);

      try {
        const response = await fetch("/api/profile/aptitude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers,
            userType: "Employed", // Default to Employed (job seeker) for students
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Redirect to recommendations page to show career matches
          router.push("/recommendations");
          router.refresh();
        } else {
          console.error("Failed to save aptitude:", data.error);
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error saving aptitude:", error);
        router.push("/dashboard");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const Icon = currentQuestion.icon;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-primary text-3xl font-bold">Aptitude Assessment</h1>
          <p className="text-muted-foreground mt-2">
            Help us understand your interests and strengths to recommend the best career paths for
            you.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <StepProgress steps={totalSteps} currentStep={currentStep + 1} />
        </div>

        {/* Question Card */}
        <Card variant="elevated" className="animate-fade-in">
          <CardContent className="p-8">
            {/* Header with mascot */}
            <div className="mb-6 flex items-start gap-4">
              <Mascot size="md" mood="thinking" animate={false} />
              <div className="flex-1">
                <div className="text-primary mb-2 flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium tracking-wide uppercase">
                    {currentQuestion.category}
                  </span>
                </div>
                <h2 className="text-foreground text-2xl font-bold">{currentQuestion.question}</h2>
                <p className="text-muted-foreground mt-1">{currentQuestion.description}</p>
              </div>
            </div>

            {/* Options */}
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.value)}
                  className={`rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                    isSelected(option.value)
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        isSelected(option.value)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {isSelected(option.value) && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="border-border mt-8 flex items-center justify-between border-t pt-6">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>

              <span className="text-muted-foreground text-sm">
                {currentStep + 1} of {totalSteps}
              </span>

              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {isLastStep ? "Complete" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skip option */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Skip for now, I&apos;ll complete this later
          </button>
        </div>
      </div>
    </div>
  );
}
