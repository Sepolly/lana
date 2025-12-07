"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";
import { Send, CheckCircle2 } from "lucide-react";

interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
}

export function JobApplicationForm({ jobId, jobTitle }: JobApplicationFormProps) {
  const router = useRouter();
  const [coverLetter, setCoverLetter] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverLetter: coverLetter.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      setSubmitted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-success/5 border-success/20">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="text-success mx-auto h-12 w-12" />
          <h3 className="text-foreground mt-4 font-semibold">Application Sent!</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            Your application for {jobTitle} has been submitted successfully.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Apply Now</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">
              Cover Letter (Optional)
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you're a great fit for this role..."
              className="border-border bg-card focus:ring-primary h-32 w-full resize-none rounded-xl border p-3 text-sm focus:ring-2 focus:outline-none"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>
          )}

          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Submit Application
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            Your certificates will be shared with the employer
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
