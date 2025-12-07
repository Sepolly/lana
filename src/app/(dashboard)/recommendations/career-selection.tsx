"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Progress,
  Spinner,
  useSuccessToast,
  useErrorToast,
} from "@/components/ui";
import { TrendingUp, ArrowRight, CheckCircle2, Loader2, Sparkles, BookOpen } from "lucide-react";
import { WaitlistConsentDialog } from "@/components/waitlist-consent-dialog";

interface CareerRecommendation {
  id: string;
  title: string;
  description: string;
  matchScore: number;
  reasoning?: string;
  skills: string[];
  category?: string;
  averageSalary?: string;
  growthOutlook?: string;
  demandScore?: number;
}

interface GeneratedCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: string;
  duration: number;
  skills: string[];
  careerPaths: string[];
  isNew: boolean;
}

interface CareerSelectionCardsProps {
  careers: CareerRecommendation[];
}

export function CareerSelectionCards({ careers }: CareerSelectionCardsProps) {
  const router = useRouter();
  const [selectedCareer, setSelectedCareer] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedCourse, setGeneratedCourse] = React.useState<GeneratedCourse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showWaitlistDialog, setShowWaitlistDialog] = React.useState(false);
  const [waitlistCareerPath, setWaitlistCareerPath] = React.useState<string | null>(null);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = React.useState(false);
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();

  const handleSelectCareer = async (career: CareerRecommendation) => {
    if (isLoading) return;

    setSelectedCareer(career.id);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/careers/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if course is not available - show waitlist dialog
        if (data.courseNotAvailable && data.careerPath) {
          setWaitlistCareerPath(data.careerPath);
          setShowWaitlistDialog(true);
          setSelectedCareer(null);
          setIsLoading(false);
          return;
        }
        throw new Error(data.error || data.message || "Failed to generate course");
      }

      setGeneratedCourse(data.data.course);

      // Navigate to the course after a short delay
      setTimeout(() => {
        router.push(`/courses/${data.data.course.slug}`);
      }, 2000);
    } catch (err) {
      console.error("Career selection error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSelectedCareer(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!waitlistCareerPath) return;

    setIsJoiningWaitlist(true);
    try {
      // Get user email from session (we'll need to fetch it)
      const userResponse = await fetch("/api/user/me");
      const userData = await userResponse.json();
      const userEmail = userData.user?.email;

      if (!userEmail) {
        errorToast("Error", "Unable to get your email. Please try again.");
        return;
      }

      const response = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerPath: waitlistCareerPath,
          email: userEmail,
          consentToNotify: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.alreadyOnWaitlist) {
          successToast("Already on Waitlist", "You're already on the waitlist for this course!");
        } else {
          successToast("Added to Waitlist", "We'll notify you when this course becomes available!");
        }
        setShowWaitlistDialog(false);
        setWaitlistCareerPath(null);
      } else {
        errorToast("Error", data.error || "Failed to join waitlist. Please try again.");
      }
    } catch (err) {
      console.error("Waitlist join error:", err);
      errorToast("Error", "Failed to join waitlist. Please try again.");
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  // Show success state
  if (generatedCourse) {
    return (
      <Card className="bg-success/5 border-success/20">
        <CardContent className="py-12 text-center">
          <div className="bg-success/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <CheckCircle2 className="text-success h-8 w-8" />
          </div>
          <h3 className="text-foreground text-xl font-bold">
            {generatedCourse.isNew ? "Course Created!" : "Course Found!"}
          </h3>
          <p className="text-muted-foreground mt-2">
            {generatedCourse.isNew
              ? `We've generated "${generatedCourse.title}" just for you with YouTube tutorials!`
              : `"${generatedCourse.title}" is ready for you to start learning.`}
          </p>
          <div className="text-primary mt-4 flex items-center justify-center gap-2">
            <BookOpen className="h-5 w-5" />
            <span>{generatedCourse.skills.length} skills</span>
            <span>•</span>
            <span>{generatedCourse.duration}h</span>
            <span>•</span>
            <span>{generatedCourse.level}</span>
          </div>
          <div className="text-muted-foreground mt-6 flex items-center justify-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirecting to course...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {careers.slice(0, 6).map((career, index) => {
        const isSelected = selectedCareer === career.id;
        // Use index as part of key to ensure uniqueness even if career.id has duplicates
        const uniqueKey = `${career.id}-${index}`;

        return (
          <Card
            key={uniqueKey}
            variant="interactive"
            className={`overflow-hidden transition-all duration-300 ${
              isSelected ? "ring-primary ring-2" : ""
            } ${isLoading && !isSelected ? "opacity-50" : ""}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs font-medium">
                    {career.category || "General"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-primary text-2xl font-bold">{career.matchScore}%</p>
                  <p className="text-muted-foreground text-xs">Match</p>
                </div>
              </div>
              <CardTitle className="mt-3 text-xl">{career.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {career.reasoning || career.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Match Progress */}
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Career Match</span>
                  <span className="text-primary font-medium">{career.matchScore}%</span>
                </div>
                <Progress value={career.matchScore} variant="primary" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <p className="text-muted-foreground text-xs">Growth Outlook</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="text-success h-4 w-4" />
                    <span className="text-foreground font-medium">
                      {career.growthOutlook || "High"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Salary Range</p>
                  <p className="text-foreground font-medium">
                    {career.averageSalary || "$40k-80k"}
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div>
                <p className="text-muted-foreground mb-2 text-xs">Skills You'll Learn</p>
                <div className="flex flex-wrap gap-1">
                  {career.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                  {career.skills.length > 4 && (
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs">
                      +{career.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Button
                fullWidth
                onClick={() => handleSelectCareer(career)}
                disabled={isLoading}
                isLoading={isSelected && isLoading}
                rightIcon={!isLoading && <ArrowRight className="h-4 w-4" />}
                leftIcon={!isLoading && <Sparkles className="h-4 w-4" />}
              >
                {isSelected && isLoading ? "Generating Course..." : "Choose This Career"}
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-center lg:col-span-2">
          {error}. Please try again.
        </div>
      )}

      {/* Waitlist Consent Dialog */}
      <WaitlistConsentDialog
        isOpen={showWaitlistDialog}
        onClose={() => {
          setShowWaitlistDialog(false);
          setWaitlistCareerPath(null);
        }}
        onConfirm={handleJoinWaitlist}
        careerPath={waitlistCareerPath || ""}
        isLoading={isJoiningWaitlist}
      />
    </div>
  );
}
