import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Mascot, Button } from "@/components/ui";
import Link from "next/link";
import { ArrowRight, BookOpen, Award, Briefcase, Brain } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch all user stats in parallel
  const [profile, enrollmentCount, certificateCount, applicationCount, existingCourses] = await Promise.all([
    // Check if user has completed aptitude test
    db.studentProfile.findUnique({
      where: { userId: session.user.id },
    }),
    // Count enrollments
    db.enrollment.count({
      where: { userId: session.user.id },
    }),
    // Count certificates
    db.certificate.count({
      where: { userId: session.user.id },
    }),
    // Count job applications
    db.jobApplication.count({
      where: { userId: session.user.id },
    }),
    // Fetch existing courses from database
    db.course.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        level: true,
        duration: true,
      },
    }),
  ]);

  const hasCompletedAptitude = profile?.aptitudeCompleted ?? false;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 bg-gradient-to-r from-secondary/30 to-tertiary/30 rounded-2xl p-6 lg:p-8">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back, {session.user.name?.split(" ")[0] || "Student"}! 👋
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            {hasCompletedAptitude
              ? "Continue your learning journey and explore new opportunities."
              : "Let's get started by discovering your strengths and interests."}
          </p>
        </div>
        <div className="hidden lg:block">
          <Mascot 
            size="lg" 
            mood={hasCompletedAptitude ? "happy" : "waving"} 
            animate={false} 
          />
        </div>
      </div>

      {/* CTA Card for users who haven't completed aptitude test */}
      {!hasCompletedAptitude && (
        <Card className="bg-gradient-to-br from-primary via-primary to-primary/80 text-white border-0 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <CardContent className="py-8 px-6 lg:px-8 relative">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <Brain className="w-8 h-8 lg:w-10 lg:h-10" />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-xl sm:text-2xl font-bold">Take Your Aptitude Test</h2>
                <p className="text-white/80 mt-2 text-sm sm:text-base max-w-lg">
                  Discover your unique strengths, learning style, and get personalized career recommendations powered by AI.
                </p>
              </div>
              <Link href="/onboarding" className="shrink-0">
                <Button 
                  variant="secondary" 
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="shadow-lg"
                >
                  Start Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Link href="/courses" className="block">
          <Card variant="interactive" className="h-full">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{enrollmentCount}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Courses Enrolled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/certificates" className="block">
          <Card variant="interactive" className="h-full">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-tertiary flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{certificateCount}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Certificates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/jobs" className="block">
          <Card variant="interactive" className="h-full">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{applicationCount}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={hasCompletedAptitude ? "/recommendations" : "/onboarding"} className="block">
          <Card variant="interactive" className="h-full">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-tertiary flex items-center justify-center shrink-0">
                  <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className={`text-lg sm:text-xl font-bold ${hasCompletedAptitude ? "text-success" : "text-amber-500"}`}>
                    {hasCompletedAptitude ? "Done ✓" : "Pending"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Aptitude Test</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recommended Careers & Courses */}
      {hasCompletedAptitude && profile?.recommendedCareers && Array.isArray(profile.recommendedCareers) && profile.recommendedCareers.length > 0 && (
        <div className="space-y-8">
          {/* Top Career Matches */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Your Top Career Matches
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Based on your aptitude results</p>
              </div>
              <Link
                href="/recommendations"
                className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {(profile.recommendedCareers as Array<{id: string; title: string; description: string; matchScore: number; category?: string}>)
                .slice(0, 3)
                .map((career, index) => (
                  <Link key={`${career.id}-${index}`} href="/recommendations">
                    <Card variant="interactive" className="h-full">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                            {career.category || "Career"}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-primary">{career.matchScore}%</span>
                            <span className="text-xs text-muted-foreground">match</span>
                          </div>
                        </div>
                        <CardTitle className="text-lg">{career.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-2">
                          {career.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
            </div>
          </div>

          {/* Recommended Courses */}
          {profile?.recommendedCourses && Array.isArray(profile.recommendedCourses) && profile.recommendedCourses.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Recommended Courses
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Tailored to your career goals</p>
                </div>
                <Link
                  href="/courses"
                  className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {(() => {
                  const recommendedCourses = profile.recommendedCourses as Array<{id: string; title: string; matchScore: number; level: string; duration: string}>;
                  
                  // Create lookup of existing DB course titles
                  const dbCourseTitles = new Map(
                    existingCourses.map(c => [c.title?.toLowerCase().trim(), c])
                  );
                  
                  // For each recommended course, use DB version if it exists
                  const mergedCourses = recommendedCourses.map(rec => {
                    const titleKey = rec.title?.toLowerCase().trim();
                    const dbCourse = dbCourseTitles.get(titleKey);
                    
                    if (dbCourse) {
                      // Use database course with recommendation's matchScore
                      return {
                        id: dbCourse.slug || dbCourse.id,
                        title: dbCourse.title,
                        matchScore: rec.matchScore,
                        level: dbCourse.level,
                        duration: typeof dbCourse.duration === 'number' ? `${dbCourse.duration}h` : dbCourse.duration,
                        isFromDb: true,
                      };
                    }
                    return { ...rec, isFromDb: false };
                  });
                  
                  // Deduplicate by title
                  const seen = new Set<string>();
                  return mergedCourses.filter(course => {
                    const key = course.title?.toLowerCase().trim();
                    if (!key || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  }).slice(0, 4);
                })().map((course, index) => (
                    <Link key={`${course.id}-${index}`} href={`/courses/${course.id}`} className="block">
                      <Card variant="interactive" className="h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-primary font-semibold uppercase tracking-wide">
                              {course.level}
                            </span>
                            <span className="text-sm font-bold text-primary">{course.matchScore}%</span>
                          </div>
                          <CardTitle className="text-base leading-tight">{course.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground">{course.duration}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Getting Started Guide (for new users) */}
      {!hasCompletedAptitude && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Getting Started
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Follow these steps to unlock your personalized career path
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Take Aptitude Test
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Discover your unique strengths and learning style through our comprehensive assessment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden opacity-60">
              <div className="absolute top-0 left-0 w-1 h-full bg-muted" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Get Recommendations
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Receive AI-powered career and course suggestions tailored to your profile.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden opacity-60">
              <div className="absolute top-0 left-0 w-1 h-full bg-muted" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Start Learning
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Enroll in courses designed for your career path and begin your journey.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

