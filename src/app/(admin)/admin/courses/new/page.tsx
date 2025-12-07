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
import { Search, BookOpen, Loader2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Career {
  id: string;
  title: string;
  skills: string[];
  matchScore: number;
}

export default function NewCoursePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [careers, setCareers] = React.useState<Career[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedCareer, setSelectedCareer] = React.useState<Career | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();

  // Load careers from Pinecone
  const loadCareers = React.useCallback(async (query: string = "") => {
    setIsLoading(true);
    try {
      const url = query.trim()
        ? `/api/admin/careers/from-pinecone?q=${encodeURIComponent(query)}&limit=50`
        : `/api/admin/careers/from-pinecone?limit=50`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setCareers(data.careers || []);
      } else {
        console.error("Failed to load careers:", data.error);
      }
    } catch (error) {
      console.error("Error loading careers:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load careers on mount
  React.useEffect(() => {
    loadCareers();
  }, [loadCareers]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCareers(searchQuery);
  };

  // Handle career selection and course creation
  const handleCreateCourse = async (career: Career) => {
    setSelectedCareer(career);
    setIsCreating(true);

    try {
      const response = await fetch("/api/admin/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerPath: career.title,
          title: `${career.title} Course`,
          description: `Comprehensive course for ${career.title} covering essential skills and knowledge.`,
          level: "BEGINNER",
          skills: career.skills,
        }),
      });

      const data = await response.json();

      if (data.success) {
        successToast("Course Created", "Course has been created successfully");
        // Redirect to course edit page
        router.push(`/admin/courses/${data.course.id}/edit`);
      } else {
        errorToast("Failed to Create Course", data.error || "Unknown error");
        setIsCreating(false);
        setSelectedCareer(null);
      }
    } catch (error) {
      console.error("Error creating course:", error);
      errorToast("Error", "Failed to create course. Please try again.");
      setIsCreating(false);
      setSelectedCareer(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-3xl font-bold">Create New Course</h1>
          <p className="text-muted-foreground mt-1">
            Select a career from Pinecone to create a course
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search careers (e.g., Computer Science, Graphics Design)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Careers List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Careers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
              <p className="text-muted-foreground">Loading careers from Pinecone...</p>
            </div>
          ) : careers.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">No careers found</p>
              <p className="text-muted-foreground mt-2 text-sm">Try a different search query</p>
            </div>
          ) : (
            <div className="space-y-2">
              {careers.map((career) => (
                <div
                  key={career.id}
                  className="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-foreground font-semibold">{career.title}</h3>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-muted-foreground text-sm">
                        {career.skills.length} skills
                      </span>
                      {career.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {career.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {career.skills.length > 3 && (
                            <span className="text-muted-foreground text-xs">
                              +{career.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCreateCourse(career)}
                    disabled={isCreating && selectedCareer?.id === career.id}
                    leftIcon={
                      isCreating && selectedCareer?.id === career.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )
                    }
                  >
                    {isCreating && selectedCareer?.id === career.id
                      ? "Creating..."
                      : "Create Course"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
