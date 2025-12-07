import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, Button, Mascot } from "@/components/ui";
import { ArrowLeft, MapPin, Clock, DollarSign, Building2, Star, Users, Calendar, CheckCircle2, Briefcase, GraduationCap } from "lucide-react";
import { JobApplicationForm } from "./application-form";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function JobDetailPage({ params }: PageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const job = await db.job.findUnique({
    where: { slug },
    include: {
      company: true,
      _count: { select: { applications: true } },
    },
  });

  if (!job) {
    notFound();
  }

  // Get user's certificates and existing application
  const [certificates, existingApplication] = await Promise.all([
    db.certificate.findMany({
      where: { userId: session.user.id },
      include: { course: true },
    }),
    db.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId: job.id,
        },
      },
    }),
  ]);

  const hasCertificates = certificates.length > 0;
  const hasApplied = !!existingApplication;

  // Check if user has required courses
  const userCourseIds = certificates.map((c) => c.course.slug);
  const hasRequiredCourses = job.requiredCourses.length === 0 || 
    job.requiredCourses.every((courseSlug) => userCourseIds.includes(courseSlug));

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    REVIEWED: "bg-blue-100 text-blue-800 border-blue-300",
    INTERVIEW: "bg-purple-100 text-purple-800 border-purple-300",
    ACCEPTED: "bg-green-100 text-green-800 border-green-300",
    REJECTED: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back link */}
      <Link href="/jobs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
          {job.company.logo ? (
            <img
              src={job.company.logo}
              alt={job.company.name}
              className="w-full h-full rounded-2xl object-cover"
            />
          ) : (
            <Building2 className="w-10 h-10 text-primary" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
                {job.isDirectPlacement && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    <Star className="w-3 h-3" />
                    Direct Placement
                  </span>
                )}
              </div>
              <p className="text-lg text-muted-foreground mt-1">
                {job.company.name}
                {job.company.isPartner && (
                  <span className="text-primary ml-2">• Official Partner</span>
                )}
              </p>
            </div>
          </div>

          {/* Quick info */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
            )}
            {job.jobType && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {job.jobType}
              </span>
            )}
            {job.salaryRange && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {job.salaryRange}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {job._count.applications} applicants
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Posted {new Date(job.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground">
                <p className="whitespace-pre-wrap">{job.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          {job.requirements && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  <p className="whitespace-pre-wrap">{job.requirements}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Required Skills */}
          {job.requiredSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="text-sm px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Required Courses */}
          {job.requiredCourses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Required Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {job.requiredCourses.map((courseSlug) => {
                    const isCompleted = userCourseIds.includes(courseSlug);
                    return (
                      <div
                        key={courseSlug}
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          isCompleted ? "bg-success/10" : "bg-muted"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                        )}
                        <span className={isCompleted ? "text-foreground" : "text-muted-foreground"}>
                          {courseSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        </span>
                        {!isCompleted && (
                          <Link
                            href={`/courses/${courseSlug}`}
                            className="ml-auto text-sm text-primary hover:underline"
                          >
                            Get Certified
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Status or Form */}
          {hasApplied ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                <h3 className="font-semibold text-foreground mt-4">Application Submitted</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Your application is under review
                </p>
                <div className={`inline-block mt-4 text-sm px-3 py-1.5 rounded-full border ${statusColors[existingApplication.status]}`}>
                  {existingApplication.status}
                </div>
                {existingApplication.status === "INTERVIEW" && (
                  <p className="text-sm text-primary mt-4">
                    Check your email for interview details!
                  </p>
                )}
              </CardContent>
            </Card>
          ) : hasCertificates && hasRequiredCourses ? (
            <JobApplicationForm jobId={job.id} jobTitle={job.title} />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Mascot size="md" mood="thinking" animate={false} />
                <h3 className="font-semibold text-foreground mt-4">Not Eligible Yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {!hasCertificates
                    ? "Complete at least one course to apply"
                    : "Complete the required courses to be eligible"}
                </p>
                <Link href="/courses" className="inline-block mt-4">
                  <Button size="sm">Browse Courses</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About {job.company.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.company.description && (
                <p className="text-sm text-muted-foreground">
                  {job.company.description}
                </p>
              )}
              <div className="space-y-2 text-sm">
                {job.company.industry && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>{job.company.industry}</span>
                  </div>
                )}
                {job.company.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{job.company.location}</span>
                  </div>
                )}
                {job.company.website && (
                  <a
                    href={job.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Visit Website →
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

