"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, Button, ConfirmDialog, useErrorToast, useSuccessToast } from "@/components/ui";
import { Plus, Briefcase, Building2, MapPin, Users, Edit2, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";

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
  const [applicationStats, setApplicationStats] = React.useState<{ status: string; _count: number }[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<{ id: string; title: string } | null>(null);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
          <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Manage job listings and applications
          </p>
        </div>
        <Link href="/admin/jobs/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Add Job
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{jobs.length}</p>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeJobs}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalApplications}</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{uniqueCompanies}</p>
                <p className="text-sm text-muted-foreground">Companies</p>
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
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Job</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Company</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Location</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Applications</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.slug}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                          {job.company.logo ? (
                            <img
                              src={job.company.logo}
                              alt={job.company.name}
                              className="w-full h-full rounded-lg object-cover"
                            />
                          ) : (
                            <Building2 className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <span className="text-foreground">{job.company.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location || "Remote"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-foreground">{job.jobType || "Full-time"}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{job._count.applications}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {job.isActive ? (
                        <span className="flex items-center gap-1 text-success text-sm">
                          <Eye className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground text-sm">
                          <EyeOff className="w-4 h-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/jobs/${job.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteJob(job.id, job.title)}
                          disabled={deletingJobId === job.id}
                        >
                          {deletingJobId === job.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
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
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No jobs yet</p>
              <Link href="/admin/jobs/new" className="inline-block mt-4">
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

