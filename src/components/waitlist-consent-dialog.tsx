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
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Get Notified When Available
              </h3>
              <p className="text-sm text-muted-foreground">
                We can notify you via email and in-app notification when this course becomes available.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-primary"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">
                  I consent to receive notifications
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                You'll receive an email and in-app notification when the course for "{careerPath}" becomes available.
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!consentGiven || isLoading}
            leftIcon={isLoading ? undefined : <CheckCircle2 className="w-4 h-4" />}
          >
            {isLoading ? "Adding to Waitlist..." : "Join Waitlist"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

