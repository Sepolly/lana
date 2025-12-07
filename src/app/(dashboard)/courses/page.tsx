import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Mascot } from "@/components/ui";
import { BookOpen, Clock, BarChart3, ArrowRight, Search, Filter } from "lucide-react";

export default async function CoursesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get user's profile and enrollments
  const [profile, enrollments, courses] = await Promise.all([
    db.studentProfile.findUnique({
      where: { userId: session.user.id },
    }),
    db.enrollment.findMany({
      where: { userId: session.user.id },
      include: { course: true },
    }),
    db.course.findMany({
      where: { isPublished: true },
      include: {
        _count: {
          select: { topics: true, enrollments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
  const hasCompletedAptitude = profile?.aptitudeCompleted ?? false;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Courses</h1>
          <p className="text-muted-foreground mt-1">
            Explore courses tailored to your career goals
          </p>
        </div>
        
        {/* Search and Filter */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Aptitude CTA for users who haven't taken the test */}
      {!hasCompletedAptitude && (
        <Card className="bg-gradient-to-r from-secondary to-secondary/50 border-0">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <Mascot size="md" mood="waving" animate={false} />
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-semibold text-foreground">
                  Get Personalized Recommendations
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Take the aptitude test to see courses matched to your interests and learning style.
                </p>
              </div>
              <Link href="/onboarding">
                <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Take Test
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Enrollments */}
      {enrollments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Continue Learning
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((enrollment) => (
              <Link key={enrollment.id} href={`/courses/${enrollment.course.slug}`}>
                <Card variant="interactive" className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {enrollment.course.level}
                      </span>
                      <span className="text-sm font-medium text-primary">
                        {Math.round(enrollment.progress)}%
                      </span>
                    </div>
                    <CardTitle className="text-lg mt-2">
                      {enrollment.course.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      {enrollment.status === "COMPLETED"
                        ? "Completed"
                        : `${enrollment.progress < 100 ? "In Progress" : "Ready for exam"}`}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Courses */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {hasCompletedAptitude ? "Recommended For You" : "All Courses"}
        </h2>
        
        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mascot size="lg" mood="thinking" animate={false} />
              <h3 className="font-semibold text-foreground mt-4">
                No courses available yet
              </h3>
              <p className="text-muted-foreground mt-2">
                Check back soon for new courses!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              
              return (
                <Link key={course.id} href={`/courses/${course.slug}`}>
                  <Card variant="interactive" className="h-full">
                    {/* Thumbnail */}
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary rounded-t-2xl flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-primary/50" />
                    </div>
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {course.level}
                        </span>
                        {isEnrolled && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-success/10 text-success">
                            Enrolled
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg mt-2">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{course._count.topics} Topics</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          <span>{course._count.enrollments}</span>
                        </div>
                      </div>
                      
                      {/* Skills tags */}
                      {course.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {course.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                              {skill}
                            </span>
                          ))}
                          {course.skills.length > 3 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              +{course.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

