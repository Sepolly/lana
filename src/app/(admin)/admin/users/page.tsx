"use client";

import * as React from "react";
import { Card, CardContent, Button, useErrorToast, useSuccessToast } from "@/components/ui";
import {
  Users,
  Shield,
  Mail,
  Calendar,
  BookOpen,
  Award,
  MoreHorizontal,
  Loader2,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "STUDENT" | "ADMIN";
  emailVerified: Date | null;
  createdAt: Date;
  profile: {
    aptitudeCompleted: boolean;
  } | null;
  _count: {
    enrollments: number;
    certificates: number;
    jobApplications: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [showMenu, setShowMenu] = React.useState<string | null>(null);
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();

  React.useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "STUDENT" | "ADMIN") => {
    setEditingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();
      if (data.success) {
        // Update state directly instead of reloading
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        setShowMenu(null);
        successToast("User Role Updated", `User role has been changed to ${newRole}`);
      } else {
        errorToast("Failed to Update User Role", data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      errorToast("Error", "Failed to update user role. Please try again.");
    } finally {
      setEditingUserId(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">Manage all users on the platform</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground text-sm">
            Total: <span className="text-foreground font-bold">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <Users className="text-primary h-6 w-6" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">{users.length}</p>
                <p className="text-muted-foreground text-sm">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">
                  {users.filter((u) => u.emailVerified).length}
                </p>
                <p className="text-muted-foreground text-sm">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">
                  {users.filter((u) => u._count.enrollments > 0).length}
                </p>
                <p className="text-muted-foreground text-sm">Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">
                  {users.filter((u) => u._count.certificates > 0).length}
                </p>
                <p className="text-muted-foreground text-sm">Certified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-muted-foreground p-4 text-left font-medium">User</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Role</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Status</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Enrollments</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Certificates</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Joined</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full">
                          <span className="text-secondary-foreground text-sm font-bold">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-foreground font-medium">{user.name || "No name"}</p>
                          <p className="text-muted-foreground flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          user.role === "ADMIN"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {user.emailVerified ? (
                          <span className="text-success flex items-center gap-1 text-xs">
                            <Shield className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Unverified</span>
                        )}
                        {user.profile?.aptitudeCompleted && (
                          <span className="text-primary flex items-center gap-1 text-xs">
                            Aptitude Done
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-foreground">{user._count.enrollments}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-foreground">{user._count.certificates}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-muted-foreground flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setShowMenu(showMenu === user.id ? null : user.id)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {showMenu === user.id && (
                          <div className="bg-background border-border absolute right-0 z-10 mt-2 w-48 rounded-lg border shadow-lg">
                            <div className="p-2">
                              <button
                                onClick={() => {
                                  if (user.role === "STUDENT") {
                                    handleUpdateRole(user.id, "ADMIN");
                                  } else {
                                    handleUpdateRole(user.id, "STUDENT");
                                  }
                                }}
                                className="hover:bg-muted flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
                                disabled={editingUserId === user.id}
                              >
                                {editingUserId === user.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <Shield className="h-4 w-4" />
                                    {user.role === "STUDENT" ? "Make Admin" : "Make Student"}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="py-12 text-center">
              <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">No users yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
