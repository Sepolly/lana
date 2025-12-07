"use client";

import * as React from "react";
import { Card, CardContent, Button } from "@/components/ui";
import { Award, CheckCircle2, AlertTriangle } from "lucide-react";
import type { ExamSchedule, Course } from "@prisma/client";

type ExamData = ExamSchedule & { course: { id: string; title: string } };

interface PendingCertificatesProps {
  exams: ExamData[];
}

export function PendingCertificates({ exams }: PendingCertificatesProps) {
  const [generating, setGenerating] = React.useState<Record<string, boolean>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const generateCertificate = async (examId: string) => {
    setGenerating((prev) => ({ ...prev, [examId]: true }));
    setErrors((prev) => {
      const { [examId]: _, ...rest } = prev;
      return rest;
    });

    try {
      const response = await fetch(`/api/exams/${examId}/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh the page to show the new certificate
        window.location.reload();
      } else {
        setErrors((prev) => ({
          ...prev,
          [examId]: data.error || "Failed to generate certificate",
        }));
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, [examId]: "Network error. Please try again." }));
      console.error("Certificate generation error:", error);
    } finally {
      setGenerating((prev) => ({ ...prev, [examId]: false }));
    }
  };

  if (exams.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {exams.map((exam) => (
        <Card key={exam.id} className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-foreground truncate font-semibold">{exam.course.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Passed with {exam.score}% - Certificate not yet generated
                </p>

                {errors[exam.id] && (
                  <p className="text-destructive mt-2 text-sm">{errors[exam.id]}</p>
                )}

                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => generateCertificate(exam.id)}
                  isLoading={generating[exam.id]}
                  leftIcon={<Award className="h-4 w-4" />}
                >
                  Generate Certificate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
