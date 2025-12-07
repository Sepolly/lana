"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
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
import { ArrowLeft, Loader2, Save, X, Building2 } from "lucide-react";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  location: string | null;
  logo: string | null;
  isPartner: boolean;
  _count: {
    jobs: number;
  };
}

export default function EditCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [company, setCompany] = React.useState<Company | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingCompany, setEditingCompany] = React.useState(false);
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

  React.useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
        setFormData({
          name: data.company.name,
          description: data.company.description || "",
          website: data.company.website || "",
          industry: data.company.industry || "",
          location: data.company.location || "",
          logo: data.company.logo || "",
          isPartner: data.company.isPartner,
        });
      }
    } catch (error) {
      console.error("Error loading company:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCompany = async () => {
    if (!company) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/companies/${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        // Update state directly instead of reloading
        setCompany(data.company);
        setEditingCompany(false);
        successToast("Company Updated", "Company has been updated successfully");
      } else {
        errorToast("Failed to Update Company", data.error || data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error updating company:", error);
      errorToast("Error", "Failed to update company. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Company not found</p>
        <Link href="/admin/companies">
          <Button className="mt-4">Back to Companies</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/companies">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {company.logo && (
              <img
                src={company.logo}
                alt={company.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-foreground text-3xl font-bold">{company.name}</h1>
              <p className="text-muted-foreground mt-1">
                {company._count.jobs} job{company._count.jobs !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
        {!editingCompany && (
          <Button
            onClick={() => setEditingCompany(true)}
            variant="outline"
            leftIcon={<Save className="h-4 w-4" />}
          >
            Edit
          </Button>
        )}
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Company Information</CardTitle>
            {editingCompany && (
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateCompany}
                  disabled={isSaving}
                  size="sm"
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={() => {
                    setEditingCompany(false);
                    if (company) {
                      setFormData({
                        name: company.name,
                        description: company.description || "",
                        website: company.website || "",
                        industry: company.industry || "",
                        location: company.location || "",
                        logo: company.logo || "",
                        isPartner: company.isPartner,
                      });
                    }
                  }}
                  variant="outline"
                  size="sm"
                  leftIcon={<X className="h-4 w-4" />}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingCompany ? (
            <>
              <div>
                <label className="text-foreground text-sm font-medium">Company Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
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
                  />
                </div>
                <div>
                  <label className="text-foreground text-sm font-medium">Industry</label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="mt-1"
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
                  />
                </div>
                <div>
                  <label className="text-foreground text-sm font-medium">Logo URL</label>
                  <Input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="mt-1"
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
            </>
          ) : (
            <>
              {company.description && (
                <div>
                  <label className="text-foreground text-sm font-medium">Description</label>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                    {company.description}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {company.website && (
                  <div>
                    <label className="text-foreground text-sm font-medium">Website</label>
                    <p className="text-muted-foreground mt-1">
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {company.website}
                      </a>
                    </p>
                  </div>
                )}
                {company.industry && (
                  <div>
                    <label className="text-foreground text-sm font-medium">Industry</label>
                    <p className="text-muted-foreground mt-1">{company.industry}</p>
                  </div>
                )}
              </div>
              {company.location && (
                <div>
                  <label className="text-foreground text-sm font-medium">Location</label>
                  <p className="text-muted-foreground mt-1">{company.location}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
