"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  Button,
  ConfirmDialog,
  useErrorToast,
  useSuccessToast,
} from "@/components/ui";
import {
  Plus,
  Briefcase,
  Building2,
  MapPin,
  Users,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  jobType: string | null;
  isActive: boolean;
  company: {
    id: string;
    name: string;
    logo: string | null;
  };
  _count: {
    applications: number;
  };
}

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [deletingJobId, setDeletingJobId] = React.useState<string | null>(null);
  const [applicationStats, setApplicationStats] = React.useState<
    { status: string; _count: number }[]
  >([]);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<{
    id: string;
    title: string;
  } | null>(null);
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();

  React.useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        // Calculate stats
        const statsMap = new Map<string, number>();
        data.jobs.forEach((job: Job) => {
          // We'll need to fetch application stats separately or calculate from job data
        });
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = (jobId: string, jobTitle: string) => {
    setShowDeleteDialog({ id: jobId, title: jobTitle });
  };

  const handleConfirmDeleteJob = async () => {
    if (!showDeleteDialog) return;

    setDeletingJobId(showDeleteDialog.id);
    try {
      const response = await fetch(`/api/admin/jobs/${showDeleteDialog.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setJobs(jobs.filter((j) => j.id !== showDeleteDialog.id));
        setShowDeleteDialog(null);
        successToast("Job Deleted", "Job has been deleted successfully");
      } else {
        errorToast("Failed to Delete Job", data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      errorToast("Error", "Failed to delete job. Please try again.");
    } finally {
      setDeletingJobId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.isActive).length;
  const totalApplications = jobs.reduce((sum, job) => sum + job._count.applications, 0);
  const uniqueCompanies = new Set(jobs.map((j) => j.company.id)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage job listings and applications</p>
        </div>
        <Link href="/admin/jobs/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add Job</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <Briefcase className="text-primary h-6 w-6" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">{jobs.length}</p>
                <p className="text-muted-foreground text-sm">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">{activeJobs}</p>
                <p className="text-muted-foreground text-sm">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">{totalApplications}</p>
                <p className="text-muted-foreground text-sm">Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">{uniqueCompanies}</p>
                <p className="text-muted-foreground text-sm">Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-muted-foreground p-4 text-left font-medium">Job</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Company</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Location</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Type</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Applications</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Status</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="text-foreground font-medium">{job.title}</p>
                        <p className="text-muted-foreground text-sm">{job.slug}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-secondary flex h-8 w-8 items-center justify-center rounded-lg">
                          {job.company.logo ? (
                            <img
                              src={job.company.logo}
                              alt={job.company.name}
                              className="h-full w-full rounded-lg object-cover"
                            />
                          ) : (
                            <Building2 className="text-primary h-4 w-4" />
                          )}
                        </div>
                        <span className="text-foreground">{job.company.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location || "Remote"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-foreground">{job.jobType || "Full-time"}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Users className="text-muted-foreground h-4 w-4" />
                        <span className="text-foreground">{job._count.applications}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {job.isActive ? (
                        <span className="text-success flex items-center gap-1 text-sm">
                          <Eye className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1 text-sm">
                          <EyeOff className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/jobs/${job.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive h-8 w-8"
                          onClick={() => handleDeleteJob(job.id, job.title)}
                          disabled={deletingJobId === job.id}
                        >
                          {deletingJobId === job.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {jobs.length === 0 && (
            <div className="py-12 text-center">
              <Briefcase className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">No jobs yet</p>
              <Link href="/admin/jobs/new" className="mt-4 inline-block">
                <Button size="sm">Add Your First Job</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog !== null}
        onClose={() => setShowDeleteDialog(null)}
        onConfirm={handleConfirmDeleteJob}
        title="Delete Job"
        description={`Are you sure you want to delete "${showDeleteDialog?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deletingJobId !== null}
      />
    </div>
  );
}
