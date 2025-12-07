import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Mascot } from "@/components/ui";
import { Briefcase, MapPin, Clock, DollarSign, Search, Filter, Building2, Star, ExternalLink } from "lucide-react";

export default async function JobsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get user's certificates to check eligibility
  const [certificates, applications, jobs] = await Promise.all([
    db.certificate.findMany({
      where: { userId: session.user.id },
      include: { course: true },
    }),
    db.jobApplication.findMany({
      where: { userId: session.user.id },
      include: {
        job: {
          include: { company: true },
        },
      },
      orderBy: { appliedAt: "desc" },
    }),
    db.job.findMany({
      where: { isActive: true },
      include: {
        company: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hasCertificates = certificates.length > 0;
  const appliedJobIds = new Set(applications.map((a) => a.jobId));

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    REVIEWED: "bg-blue-100 text-blue-800",
    INTERVIEW: "bg-purple-100 text-purple-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Opportunities</h1>
          <p className="text-muted-foreground mt-1">
            Find your next career opportunity with our partner companies
          </p>
        </div>
        
        {/* Search and Filter */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search jobs..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Eligibility Notice */}
      {!hasCertificates && (
        <Card className="bg-gradient-to-r from-tertiary to-tertiary/50 border-0">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <Mascot size="md" mood="thinking" animate={false} />
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-semibold text-foreground">
                  Get Certified to Apply
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete courses and earn certificates to become eligible for job applications.
                  Certified students get priority consideration from our partner companies.
                </p>
              </div>
              <Link href="/courses">
                <Button>Browse Courses</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Applications */}
      {applications.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            My Applications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.slice(0, 3).map((application) => (
              <Card key={application.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        {application.job.company.logo ? (
                          <img
                            src={application.job.company.logo}
                            alt={application.job.company.name}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {application.job.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {application.job.company.name}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[application.status]}`}>
                      {application.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Applied {new Date(application.appliedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          {applications.length > 3 && (
            <div className="text-center mt-4">
              <Button variant="outline" size="sm">
                View All Applications ({applications.length})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Job Listings */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Available Positions
        </h2>
        
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mascot size="lg" mood="thinking" animate={false} />
              <h3 className="font-semibold text-foreground mt-4">
                No Jobs Available
              </h3>
              <p className="text-muted-foreground mt-2">
                Check back soon for new opportunities!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const hasApplied = appliedJobIds.has(job.id);
              
              return (
                <Card key={job.id} variant="interactive">
                  <CardContent className="py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Company logo */}
                      <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        {job.company.logo ? (
                          <img
                            src={job.company.logo}
                            alt={job.company.name}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          <Building2 className="w-7 h-7 text-primary" />
                        )}
                      </div>

                      {/* Job info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground text-lg">
                                {job.title}
                              </h3>
                              {job.isDirectPlacement && (
                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  <Star className="w-3 h-3" />
                                  Direct Placement
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground">
                              {job.company.name}
                              {job.company.isPartner && (
                                <span className="text-primary ml-1">• Partner</span>
                              )}
                            </p>
                          </div>
                          {hasApplied ? (
                            <span className="text-sm text-muted-foreground">Applied</span>
                          ) : (
                            <Link href={`/jobs/${job.slug}`}>
                              <Button 
                                size="sm" 
                                rightIcon={<ExternalLink className="w-4 h-4" />}
                              >
                                View Details
                              </Button>
                            </Link>
                          )}
                        </div>

                        {/* Job details */}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
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
                            <Briefcase className="w-4 h-4" />
                            {job._count.applications} applicants
                          </span>
                        </div>

                        {/* Required skills */}
                        {job.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {job.requiredSkills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.requiredSkills.length > 4 && (
                              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                +{job.requiredSkills.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

