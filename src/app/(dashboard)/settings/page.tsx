"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { User, Lock } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [profileData, setProfileData] = useState({ name: "", email: "" });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [isLoadingPasswordStatus, setIsLoadingPasswordStatus] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || "",
        email: session.user.email || "",
      });
    }
  }, [session]);

  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        const response = await fetch("/api/user/has-password");
        const result = await response.json();
        if (result.success) {
          setHasPassword(result.hasPassword);
        }
      } catch (error) {
        console.error("Failed to check password status:", error);
      } finally {
        setIsLoadingPasswordStatus(false);
      }
    };

    if (session?.user) {
      checkPasswordStatus();
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name,
        }),
      });

      const result = await response.json();

      if (result.success) {
        addToast({ type: "success", title: "Profile updated successfully" });
        await update();
      } else {
        addToast({ type: "error", title: result.error || "Failed to update profile" });
      }
    } catch (error) {
      addToast({ type: "error", title: "Failed to update profile" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast({ type: "error", title: "Passwords do not match" });
      return;
    }

    // Trim passwords to avoid whitespace issues
    const trimmedCurrentPassword = passwordData.currentPassword.trim();
    const trimmedNewPassword = passwordData.newPassword.trim();

    if (!trimmedCurrentPassword) {
      addToast({ type: "error", title: "Current password is required" });
      return;
    }

    if (!trimmedNewPassword) {
      addToast({ type: "error", title: "New password is required" });
      return;
    }

    if (trimmedNewPassword.length < 8) {
      addToast({ type: "error", title: "Password must be at least 8 characters" });
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(trimmedNewPassword)) {
      addToast({
        type: "error",
        title:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      });
      return;
    }

    setSubmitting(true);

    try {
      // First verify the current password
      const verifyResponse = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: trimmedCurrentPassword,
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success || !verifyResult.valid) {
        addToast({
          type: "error",
          title: "Current password is incorrect",
          description: "Please verify your current password and try again",
        });
        setSubmitting(false);
        return;
      }

      // Update the password
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: trimmedCurrentPassword,
          newPassword: trimmedNewPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        addToast({ type: "success", title: "Password updated successfully" });
        setPasswordDialogOpen(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const errorMessage = result.error || "Failed to update password";
        addToast({
          type: "error",
          title: errorMessage,
          description: errorMessage.includes("incorrect")
            ? "Please verify your current password is correct"
            : undefined,
        });
      }
    } catch (error) {
      addToast({ type: "error", title: "Failed to update password" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="text-primary h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <Input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input type="email" value={profileData.email} disabled className="bg-muted" />
                <p className="text-muted-foreground mt-1 text-xs">
                  Email cannot be changed. Contact support if you need to update your email.
                </p>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {!isLoadingPasswordStatus && hasPassword && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="text-primary h-5 w-5" />
                Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
                Change Password
              </Button>
              <Dialog
                isOpen={passwordDialogOpen}
                onClose={() => setPasswordDialogOpen(false)}
                title="Change Password"
              >
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Current Password</label>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">New Password</label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      required
                      minLength={8}
                    />
                    <p className="text-muted-foreground mt-1 text-xs">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Confirm New Password</label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPasswordDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {!isLoadingPasswordStatus && !hasPassword && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="text-primary h-5 w-5" />
                Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                You signed in with Google. Password management is not available for OAuth accounts.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
