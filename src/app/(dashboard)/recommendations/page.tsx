import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Mascot, Progress } from "@/components/ui";
import { TrendingUp, GraduationCap, Briefcase, ArrowRight, BookOpen, Clock, Star, Sparkles, Play } from "lucide-react";
import { CareerSelectionCards } from "./career-selection";

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

interface CourseRecommendation {
  id: string;
  title: string;
  slug: string;
  description: string;
  matchScore?: number;
  level: string;
  duration: string | number;
  skills: string[];
  careerPaths: string[];
  isNew?: boolean;
}

export default async function RecommendationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const profile = await db.studentProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile?.aptitudeCompleted) {
    redirect("/onboarding");
  }

  const careers = Array.isArray(profile.recommendedCareers) 
    ? (profile.recommendedCareers as unknown as CareerRecommendation[]) 
    : [];
  const courses = Array.isArray(profile.recommendedCourses) 
    ? (profile.recommendedCourses as unknown as CourseRecommendation[]) 
    : [];

  // Also get any existing courses in the database that match career paths
  const existingCourses = await db.course.findMany({
    where: {
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      level: true,
      duration: true,
      skills: true,
      careerPaths: true,
      topics: { select: { id: true } },
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const learningStyleLabels: Record<string, string> = {
    VISUAL: "Visual Learner",
    AUDITORY: "Auditory Learner",
    READING_WRITING: "Reading/Writing Learner",
    KINESTHETIC: "Kinesthetic Learner",
  };

  const learningStyleDescriptions: Record<string, string> = {
    VISUAL: "You learn best through images, diagrams, videos, and visual demonstrations.",
    AUDITORY: "You learn best through listening, discussions, and verbal explanations.",
    READING_WRITING: "You learn best through reading texts, taking notes, and written materials.",
    KINESTHETIC: "You learn best through hands-on practice, experiments, and interactive activities.",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with celebration */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Mascot size="xl" mood="celebrating" animate={true} />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Your Career Recommendations
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Based on your aptitude test results, we&apos;ve identified career paths and courses 
          that align with your strengths and interests. <strong>Select a career to get started!</strong>
        </p>
      </div>

      {/* Profile Summary Card */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-white border-0">
        <CardContent className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Learning Style */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm text-white/80 uppercase tracking-wide">Learning Style</span>
              </div>
              <p className="text-xl font-bold">
                {profile.learningStyle ? learningStyleLabels[profile.learningStyle] : "Not determined"}
              </p>
              <p className="text-sm text-white/70 mt-1">
                {profile.learningStyle ? learningStyleDescriptions[profile.learningStyle] : ""}
              </p>
            </div>

            {/* Top Interests */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Star className="w-5 h-5" />
                <span className="text-sm text-white/80 uppercase tracking-wide">Top Interests</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {profile.interests?.slice(0, 3).map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 rounded-full bg-white/20 text-sm"
                  >
                    {interest.charAt(0).toUpperCase() + interest.slice(1)}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Strengths */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm text-white/80 uppercase tracking-wide">Key Strengths</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {profile.strengths?.slice(0, 3).map((strength) => (
                  <span
                    key={strength}
                    className="px-3 py-1 rounded-full bg-white/20 text-sm"
                  >
                    {strength.replace("_", " ").charAt(0).toUpperCase() + strength.slice(1).replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career Recommendations - Interactive Selection */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Choose Your Career Path</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Click on a career to generate a personalized learning path with YouTube videos for each topic.
        </p>
        
        <CareerSelectionCards careers={careers} />
      </div>

      {/* Available Courses */}
      {((Array.isArray(courses) && courses.length > 0) || existingCourses.length > 0) && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Available Courses</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Start building skills for your career with these courses, each with video tutorials.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Prefer existing database courses, then fill with recommended - deduplicated */}
            {(() => {
              // Map existing courses from database
              const dbCourses = existingCourses.map(c => ({
                id: c.id,
                title: c.title,
                slug: c.slug,
                description: c.description,
                level: c.level,
                duration: c.duration,
                skills: c.skills,
                careerPaths: c.careerPaths,
                topicCount: c.topics.length,
                isFromDb: true,
              }));
              
              // Create a lookup of existing course titles (normalized)
              const dbCourseTitles = new Set(
                dbCourses.map(c => c.title?.toLowerCase().trim()).filter(Boolean)
              );
              
              // Filter recommended courses - only keep those NOT already in database
              const recommendedCourses = (Array.isArray(courses) ? courses : [])
                .filter(c => !dbCourseTitles.has(c.title?.toLowerCase().trim()))
                .map(c => ({ ...c, isFromDb: false }));
              
              // Combine: existing DB courses first, then unique recommended ones
              const allCourses = [...dbCourses, ...recommendedCourses];
              
              // Final deduplication by title
              const seen = new Set<string>();
              const uniqueCourses = allCourses.filter(course => {
                const titleKey = course.title?.toLowerCase().trim();
                if (!titleKey || seen.has(titleKey)) return false;
                seen.add(titleKey);
                return true;
              });
              
              return uniqueCourses.slice(0, 8);
            })().map((course) => (
              <Link key={course.id} href={`/courses/${course.slug || course.id}`}>
                <Card variant="interactive" className="h-full">
                  {/* Thumbnail */}
                  <div className="h-32 bg-gradient-to-br from-secondary to-tertiary rounded-t-2xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-12 h-12 text-primary/30" />
                    </div>
                    <BookOpen className="w-10 h-10 text-primary/40 relative z-10" />
                    {'isNew' in course && course.isNew && (
                      <span className="absolute top-3 left-3 text-xs font-medium px-2 py-1 rounded-full bg-success text-white">
                        New
                      </span>
                    )}
                    {'matchScore' in course && course.matchScore && (
                      <span className="absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded-full bg-white/90 text-primary">
                        {course.matchScore}% Match
                      </span>
                    )}
                  </div>
                  
                  <CardHeader className="pb-2">
                    <span className="text-xs font-medium text-primary uppercase">
                      {course.level}
                    </span>
                    <CardTitle className="text-base line-clamp-2">{course.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{typeof course.duration === 'number' ? `${course.duration}h` : course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.skills?.length || 0} Skills</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link href="/courses">
              <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                Browse All Courses
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <Card className="bg-tertiary/30 border-0">
        <CardContent className="py-8 text-center">
          <h3 className="text-xl font-bold text-foreground">
            Ready to Start Your Journey?
          </h3>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Select a career path above to get a personalized course with video tutorials.
            Complete courses, earn certificates, and unlock job opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Link href="/courses">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Start Learning Now
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
