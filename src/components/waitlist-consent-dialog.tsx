"use client";

import * as React from "react";
import { Dialog, Button } from "@/components/ui";
import { Bell, Mail, CheckCircle2 } from "lucide-react";

interface WaitlistConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  careerPath: string;
  isLoading?: boolean;
}

export function WaitlistConsentDialog({
  isOpen,
  onClose,
  onConfirm,
  careerPath,
  isLoading = false,
}: WaitlistConsentDialogProps) {
  const [consentGiven, setConsentGiven] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setConsentGiven(false);
    }
  }, [isOpen]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Course Not Available Yet"
      description={`The course for "${careerPath}" is not currently available.`}
      size="md"
    >
      <div className="space-y-6">
        <div className="bg-primary/5 border-primary/20 rounded-xl border p-4">
          <div className="flex items-start gap-3">
            <Bell className="text-primary mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="text-foreground mb-1 font-semibold">Get Notified When Available</h3>
              <p className="text-muted-foreground text-sm">
                We can notify you via email and in-app notification when this course becomes
                available.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="border-border hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="text-primary border-border focus:ring-primary mt-1 h-4 w-4 rounded"
            />
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Mail className="text-primary h-4 w-4" />
                <span className="text-foreground font-medium">
                  I consent to receive notifications
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                You'll receive an email and in-app notification when the course for "{careerPath}"
                becomes available.
              </p>
            </div>
          </label>
        </div>

        <div className="border-border flex items-center justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!consentGiven || isLoading}
            leftIcon={isLoading ? undefined : <CheckCircle2 className="h-4 w-4" />}
          >
            {isLoading ? "Adding to Waitlist..." : "Join Waitlist"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
