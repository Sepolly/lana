"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { UserPlus, Mail, User, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Admin {
  id: string;
  email: string;
  name: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ email: "", name: "" });
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admin/admins");
      const result = await response.json();

      if (result.success) {
        setAdmins(result.data);
      } else {
        addToast({ type: "error", title: "Failed to load admins" });
      }
    } catch (error) {
      addToast({ type: "error", title: "Failed to load admins" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: "success",
          title: result.message || "Admin invitation sent successfully",
        });
        setDialogOpen(false);
        setFormData({ email: "", name: "" });
        fetchAdmins();
      } else {
        addToast({ type: "error", title: result.error || "Failed to add admin" });
      }
    } catch (error) {
      addToast({ type: "error", title: "Failed to add admin" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-muted-foreground">Loading admins...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-bold">Admin Management</h1>
          <p className="text-muted-foreground mt-1">Manage platform administrators</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
        <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title="Add New Admin">
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrators</CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No admins found</div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <User className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{admin.name || "No name"}</div>
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3" />
                        {admin.email}
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3" />
                        Added {new Date(admin.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {admin.emailVerified ? (
                      <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
