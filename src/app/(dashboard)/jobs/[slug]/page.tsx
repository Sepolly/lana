import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, Button, Mascot } from "@/components/ui";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  Star,
  Users,
  Calendar,
  CheckCircle2,
  Briefcase,
  GraduationCap,
} from "lucide-react";
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
  const hasRequiredCourses =
    job.requiredCourses.length === 0 ||
    job.requiredCourses.every((courseSlug) => userCourseIds.includes(courseSlug));

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    REVIEWED: "bg-blue-100 text-blue-800 border-blue-300",
    INTERVIEW: "bg-purple-100 text-purple-800 border-purple-300",
    ACCEPTED: "bg-green-100 text-green-800 border-green-300",
    REJECTED: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="animate-fade-in mx-auto max-w-4xl space-y-6">
      {/* Back link */}
      <Link
        href="/jobs"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="bg-secondary flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl">
          {job.company.logo ? (
            <img
              src={job.company.logo}
              alt={job.company.name}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <Building2 className="text-primary h-10 w-10" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-foreground text-2xl font-bold">{job.title}</h1>
                {job.isDirectPlacement && (
                  <span className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2 py-1 text-xs">
                    <Star className="h-3 w-3" />
                    Direct Placement
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-lg">
                {job.company.name}
                {job.company.isPartner && (
                  <span className="text-primary ml-2">• Official Partner</span>
                )}
              </p>
            </div>
          </div>

          {/* Quick info */}
          <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-4 text-sm">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
            )}
            {job.jobType && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {job.jobType}
              </span>
            )}
            {job.salaryRange && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {job.salaryRange}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {job._count.applications} applicants
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Posted {new Date(job.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm text-foreground max-w-none">
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
                <div className="prose prose-sm text-foreground max-w-none">
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
                      className="bg-secondary text-secondary-foreground rounded-full px-3 py-1.5 text-sm"
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
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5" />
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
                        className={`flex items-center gap-2 rounded-lg p-3 ${
                          isCompleted ? "bg-success/10" : "bg-muted"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="text-success h-5 w-5" />
                        ) : (
                          <div className="border-muted-foreground h-5 w-5 rounded-full border-2" />
                        )}
                        <span className={isCompleted ? "text-foreground" : "text-muted-foreground"}>
                          {courseSlug
                            .split("-")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")}
                        </span>
                        {!isCompleted && (
                          <Link
                            href={`/courses/${courseSlug}`}
                            className="text-primary ml-auto text-sm hover:underline"
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
                <CheckCircle2 className="text-success mx-auto h-12 w-12" />
                <h3 className="text-foreground mt-4 font-semibold">Application Submitted</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Your application is under review
                </p>
                <div
                  className={`mt-4 inline-block rounded-full border px-3 py-1.5 text-sm ${statusColors[existingApplication.status]}`}
                >
                  {existingApplication.status}
                </div>
                {existingApplication.status === "INTERVIEW" && (
                  <p className="text-primary mt-4 text-sm">
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
                <h3 className="text-foreground mt-4 font-semibold">Not Eligible Yet</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  {!hasCertificates
                    ? "Complete at least one course to apply"
                    : "Complete the required courses to be eligible"}
                </p>
                <Link href="/courses" className="mt-4 inline-block">
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
                <p className="text-muted-foreground text-sm">{job.company.description}</p>
              )}
              <div className="space-y-2 text-sm">
                {job.company.industry && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="text-muted-foreground h-4 w-4" />
                    <span>{job.company.industry}</span>
                  </div>
                )}
                {job.company.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="text-muted-foreground h-4 w-4" />
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
