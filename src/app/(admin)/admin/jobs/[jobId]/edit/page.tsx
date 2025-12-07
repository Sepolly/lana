"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, useErrorToast, useSuccessToast } from "@/components/ui";
import { ArrowLeft, Loader2, Save, X, Building2 } from "lucide-react";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  slug: string;
}

interface Job {
  id: string;
  companyId: string;
  title: string;
  slug: string;
  description: string;
  requirements: string | null;
  location: string | null;
  jobType: string | null;
  salaryRange: string | null;
  requiredSkills: string[];
  requiredCourses: string[];
  isDirectPlacement: boolean;
  isActive: boolean;
  expiresAt: string | null;
  company: {
    id: string;
    name: string;
  };
}

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = React.useState<Job | null>(null);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingJob, setEditingJob] = React.useState(false);
  const [formData, setFormData] = React.useState({
    companyId: "",
    title: "",
    description: "",
    requirements: "",
    location: "",
    jobType: "Full-time",
    salaryRange: "",
    requiredSkills: [] as string[],
    requiredCourses: [] as string[],
    isDirectPlacement: false,
    isActive: true,
  });
  const [newSkill, setNewSkill] = React.useState("");
  const [newCourse, setNewCourse] = React.useState("");
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();

  React.useEffect(() => {
    loadJob();
    loadCompanies();
  }, [jobId]);

  const loadJob = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data.job);
        setFormData({
          companyId: data.job.companyId,
          title: data.job.title,
          description: data.job.description,
          requirements: data.job.requirements || "",
          location: data.job.location || "",
          jobType: data.job.jobType || "Full-time",
          salaryRange: data.job.salaryRange || "",
          requiredSkills: data.job.requiredSkills || [],
          requiredCourses: data.job.requiredCourses || [],
          isDirectPlacement: data.job.isDirectPlacement,
          isActive: data.job.isActive,
        });
      }
    } catch (error) {
      console.error("Error loading job:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await fetch("/api/admin/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error("Error loading companies:", error);
    }
  };

  const handleUpdateJob = async () => {
    if (!job) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        // Update state directly instead of reloading
        setJob(data.job);
        setEditingJob(false);
        successToast("Job Updated", "Job has been updated successfully");
      } else {
        errorToast("Failed to Update Job", data.error || data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error updating job:", error);
      errorToast("Error", "Failed to update job. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.requiredSkills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        requiredSkills: [...formData.requiredSkills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      requiredSkills: formData.requiredSkills.filter((s) => s !== skill),
    });
  };

  const handleAddCourse = () => {
    if (newCourse.trim() && !formData.requiredCourses.includes(newCourse.trim())) {
      setFormData({
        ...formData,
        requiredCourses: [...formData.requiredCourses, newCourse.trim()],
      });
      setNewCourse("");
    }
  };

  const handleRemoveCourse = (course: string) => {
    setFormData({
      ...formData,
      requiredCourses: formData.requiredCourses.filter((c) => c !== course),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Job not found</p>
        <Link href="/admin/jobs">
          <Button className="mt-4">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
            <p className="text-muted-foreground mt-1">
              {job.company.name} • {job.location || "Remote"}
            </p>
          </div>
        </div>
        {!editingJob && (
          <Button onClick={() => setEditingJob(true)} variant="outline" leftIcon={<Save className="w-4 h-4" />}>
            Edit
          </Button>
        )}
      </div>

      {/* Job Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Job Information</CardTitle>
            {editingJob && (
              <div className="flex gap-2">
                <Button onClick={handleUpdateJob} disabled={isSaving} size="sm" leftIcon={<Save className="w-4 h-4" />}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={() => {
                    setEditingJob(false);
                    if (job) {
                      setFormData({
                        companyId: job.companyId,
                        title: job.title,
                        description: job.description,
                        requirements: job.requirements || "",
                        location: job.location || "",
                        jobType: job.jobType || "Full-time",
                        salaryRange: job.salaryRange || "",
                        requiredSkills: job.requiredSkills || [],
                        requiredCourses: job.requiredCourses || [],
                        isDirectPlacement: job.isDirectPlacement,
                        isActive: job.isActive,
                      });
                    }
                  }}
                  variant="outline"
                  size="sm"
                  leftIcon={<X className="w-4 h-4" />}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingJob ? (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">Company *</label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full mt-1 p-2 border border-border rounded-lg"
                  required
                >
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Job Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mt-1 p-2 border border-border rounded-lg resize-none"
                  rows={6}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Requirements</label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full mt-1 p-2 border border-border rounded-lg resize-none"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Job Type</label>
                  <select
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                    className="w-full mt-1 p-2 border border-border rounded-lg"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Salary Range</label>
                <Input
                  value={formData.salaryRange}
                  onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDirectPlacement"
                  checked={formData.isDirectPlacement}
                  onChange={(e) => setFormData({ ...formData, isDirectPlacement: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isDirectPlacement" className="text-sm font-medium text-foreground">
                  Direct Placement Opportunity
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-foreground">
                  Active (visible to users)
                </label>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{job.description}</p>
              </div>
              {job.requirements && (
                <div>
                  <label className="text-sm font-medium text-foreground">Requirements</label>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{job.requirements}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Location</label>
                  <p className="text-muted-foreground mt-1">{job.location || "Remote"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Job Type</label>
                  <p className="text-muted-foreground mt-1">{job.jobType || "Full-time"}</p>
                </div>
              </div>
              {job.salaryRange && (
                <div>
                  <label className="text-sm font-medium text-foreground">Salary Range</label>
                  <p className="text-muted-foreground mt-1">{job.salaryRange}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Required Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Required Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingJob ? (
            <>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                  placeholder="Add skill"
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddSkill} size="sm">
                  Add
                </Button>
              </div>
              {formData.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground flex items-center gap-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.length > 0 ? (
                job.requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No skills specified</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Required Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Required Courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingJob ? (
            <>
              <div className="flex gap-2">
                <Input
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCourse())}
                  placeholder="Course slug"
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddCourse} size="sm">
                  Add
                </Button>
              </div>
              {formData.requiredCourses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.requiredCourses.map((course, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1"
                    >
                      {course}
                      <button
                        type="button"
                        onClick={() => handleRemoveCourse(course)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              {job.requiredCourses.length > 0 ? (
                job.requiredCourses.map((course, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                  >
                    {course}
                  </span>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No courses required</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

