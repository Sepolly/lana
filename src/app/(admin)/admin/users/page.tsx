"use client";

import * as React from "react";
import { Card, CardContent, Button, useErrorToast, useSuccessToast } from "@/components/ui";
import { Users, Shield, Mail, Calendar, BookOpen, Award, MoreHorizontal, Loader2 } from "lucide-react";

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
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage all users on the platform
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-bold text-foreground">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.emailVerified).length}
                </p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u._count.enrollments > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u._count.certificates > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Certified</p>
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
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Enrollments</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Certificates</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-sm font-bold text-secondary-foreground">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name || "No name"}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.role === "ADMIN" 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {user.emailVerified ? (
                          <span className="text-xs text-success flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unverified</span>
                        )}
                        {user.profile?.aptitudeCompleted && (
                          <span className="text-xs text-primary flex items-center gap-1">
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
                      <span className="text-muted-foreground text-sm flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
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
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        {showMenu === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-10">
                            <div className="p-2">
                              <button
                                onClick={() => {
                                  if (user.role === "STUDENT") {
                                    handleUpdateRole(user.id, "ADMIN");
                                  } else {
                                    handleUpdateRole(user.id, "STUDENT");
                                  }
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-lg flex items-center gap-2"
                                disabled={editingUserId === user.id}
                              >
                                {editingUserId === user.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <Shield className="w-4 h-4" />
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
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

