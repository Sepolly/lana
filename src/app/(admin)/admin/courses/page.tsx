"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, Button, ConfirmDialog, useErrorToast, useSuccessToast } from "@/components/ui";
import { Plus, BookOpen, Users, Clock, Edit2, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  level: string;
  isPublished: boolean;
  topics: { id: string }[];
  _count: {
    enrollments: number;
    certificates: number;
  };
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [deletingCourseId, setDeletingCourseId] = React.useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<{ id: string; title: string } | null>(null);
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();

  React.useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = (courseId: string, courseTitle: string) => {
    setShowDeleteDialog({ id: courseId, title: courseTitle });
  };

  const handleConfirmDeleteCourse = async () => {
    if (!showDeleteDialog) return;

    setDeletingCourseId(showDeleteDialog.id);
    try {
      const response = await fetch(`/api/admin/courses/${showDeleteDialog.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        // Remove course from list
        setCourses(courses.filter((c) => c.id !== showDeleteDialog.id));
        setShowDeleteDialog(null);
        successToast("Course Deleted", "Course has been deleted successfully");
      } else {
        errorToast("Failed to Delete Course", data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      errorToast("Error", "Failed to delete course. Please try again.");
    } finally {
      setDeletingCourseId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Courses</h1>
          <p className="text-muted-foreground mt-1">
            Manage all courses on the platform
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Create Course from Career
          </Button>
        </Link>
      </div>

      {/* Courses Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Course</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Level</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Topics</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Enrolled</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Certified</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{course.title}</p>
                          <p className="text-sm text-muted-foreground">{course.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        course.level === "ADVANCED" ? "bg-red-100 text-red-800" :
                        course.level === "INTERMEDIATE" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {course.level}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-foreground">{course.topics.length}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{course._count.enrollments}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-foreground">{course._count.certificates}</span>
                    </td>
                    <td className="p-4">
                      {course.isPublished ? (
                        <span className="flex items-center gap-1 text-success text-sm">
                          <Eye className="w-4 h-4" />
                          Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground text-sm">
                          <EyeOff className="w-4 h-4" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/courses/${course.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteCourse(course.id, course.title)}
                          disabled={deletingCourseId === course.id}
                        >
                          {deletingCourseId === course.id ? (
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
          
          {courses.length === 0 && (
            <div className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No courses yet</p>
              <Link href="/admin/courses/new" className="inline-block mt-4">
                <Button size="sm">Add Your First Course</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog !== null}
        onClose={() => setShowDeleteDialog(null)}
        onConfirm={handleConfirmDeleteCourse}
        title="Delete Course"
        description={`Are you sure you want to delete "${showDeleteDialog?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deletingCourseId !== null}
      />
    </div>
  );
}

