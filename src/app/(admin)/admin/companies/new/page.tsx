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
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

export default function NewCompanyPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    website: "",
    industry: "",
    location: "",
    logo: "",
    isPartner: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/companies/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        successToast("Company Created", "Company has been created successfully");
        router.push(`/admin/companies/${data.company.id}/edit`);
      } else {
        errorToast("Failed to Create Company", data.error || data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error creating company:", error);
      errorToast("Error", "Failed to create company. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/companies">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-foreground text-3xl font-bold">Create New Company</h1>
          <p className="text-muted-foreground mt-1">Add a new company to the platform</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-foreground text-sm font-medium">Company Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
                placeholder="e.g., Tech Corp"
                required
              />
            </div>

            <div>
              <label className="text-foreground text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-border mt-1 w-full resize-none rounded-lg border p-2"
                rows={4}
                placeholder="Company description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-foreground text-sm font-medium">Website</label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="mt-1"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="text-foreground text-sm font-medium">Industry</label>
                <Input
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="mt-1"
                  placeholder="e.g., Technology"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-foreground text-sm font-medium">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1"
                  placeholder="e.g., New York, NY"
                />
              </div>
              <div>
                <label className="text-foreground text-sm font-medium">Logo URL</label>
                <Input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="mt-1"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPartner"
                checked={formData.isPartner}
                onChange={(e) => setFormData({ ...formData, isPartner: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="isPartner" className="text-foreground text-sm font-medium">
                Partner Company
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSaving} leftIcon={<Save className="h-4 w-4" />}>
            {isSaving ? "Creating..." : "Create Company"}
          </Button>
          <Link href="/admin/companies">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
