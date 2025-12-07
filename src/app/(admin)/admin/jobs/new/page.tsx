"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  useErrorToast,
  useSuccessToast,
} from "@/components/ui";
import { ArrowLeft, Loader2, Save, Building2 } from "lucide-react";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  slug: string;
}

export default function NewJobPage() {
  const router = useRouter();
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
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
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setIsLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        successToast("Job Created", "Job has been created successfully");
        router.push(`/admin/jobs/${data.job.id}/edit`);
      } else {
        errorToast("Failed to Create Job", data.error || data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error creating job:", error);
      errorToast("Error", "Failed to create job. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/jobs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-3xl font-bold">Create New Job</h1>
          <p className="text-muted-foreground mt-1">Add a new job listing to the platform</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-foreground text-sm font-medium">Company *</label>
              <select
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                className="border-border mt-1 w-full rounded-lg border p-2"
                required
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-foreground text-sm font-medium">Job Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1"
                placeholder="e.g., Software Engineer"
                required
              />
            </div>

            <div>
              <label className="text-foreground text-sm font-medium">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-border mt-1 w-full resize-none rounded-lg border p-2"
                rows={6}
                placeholder="Job description..."
                required
              />
            </div>

            <div>
              <label className="text-foreground text-sm font-medium">Requirements</label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="border-border mt-1 w-full resize-none rounded-lg border p-2"
                rows={4}
                placeholder="Job requirements..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-foreground text-sm font-medium">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1"
                  placeholder="e.g., Remote, New York, NY"
                />
              </div>
              <div>
                <label className="text-foreground text-sm font-medium">Job Type</label>
                <select
                  value={formData.jobType}
                  onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                  className="border-border mt-1 w-full rounded-lg border p-2"
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
              <label className="text-foreground text-sm font-medium">Salary Range</label>
              <Input
                value={formData.salaryRange}
                onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                className="mt-1"
                placeholder="e.g., $50,000 - $80,000"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDirectPlacement"
                checked={formData.isDirectPlacement}
                onChange={(e) => setFormData({ ...formData, isDirectPlacement: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="isDirectPlacement" className="text-foreground text-sm font-medium">
                Direct Placement Opportunity
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="isActive" className="text-foreground text-sm font-medium">
                Active (visible to users)
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    className="bg-secondary text-secondary-foreground flex items-center gap-1 rounded-full px-2 py-1 text-xs"
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Required Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCourse())}
                placeholder="Course slug (e.g., software-engineering)"
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
                    className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2 py-1 text-xs"
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
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSaving} leftIcon={<Save className="h-4 w-4" />}>
            {isSaving ? "Creating..." : "Create Job"}
          </Button>
          <Link href="/admin/jobs">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
