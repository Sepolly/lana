"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, Button, ConfirmDialog, useErrorToast, useSuccessToast } from "@/components/ui";
import { Plus, Building2, Briefcase, Edit2, Trash2, Loader2, Globe, MapPin } from "lucide-react";

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  industry: string | null;
  location: string | null;
  isPartner: boolean;
  _count: {
    jobs: number;
  };
}

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [deletingCompanyId, setDeletingCompanyId] = React.useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<{ id: string; name: string } | null>(null);
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();

  React.useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCompany = (companyId: string, companyName: string) => {
    setShowDeleteDialog({ id: companyId, name: companyName });
  };

  const handleConfirmDeleteCompany = async () => {
    if (!showDeleteDialog) return;

    setDeletingCompanyId(showDeleteDialog.id);
    try {
      const response = await fetch(`/api/admin/companies/${showDeleteDialog.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setCompanies(companies.filter((c) => c.id !== showDeleteDialog.id));
        setShowDeleteDialog(null);
        successToast("Company Deleted", "Company has been deleted successfully");
      } else {
        errorToast("Failed to Delete Company", data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      errorToast("Error", "Failed to delete company. Please try again.");
    } finally {
      setDeletingCompanyId(null);
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
          <h1 className="text-3xl font-bold text-foreground">Companies</h1>
          <p className="text-muted-foreground mt-1">
            Manage companies and partners
          </p>
        </div>
        <Link href="/admin/companies/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Add Company
          </Button>
        </Link>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <Card key={company.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{company.name}</h3>
                    {company.isPartner && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Partner
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/admin/companies/${company.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCompany(company.id, company.name)}
                    disabled={deletingCompanyId === company.id}
                  >
                    {deletingCompanyId === company.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {company.industry && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{company.industry}</span>
                  </div>
                )}
                {company.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{company.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                  <span>{company._count.jobs} job{company._count.jobs !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No companies yet</p>
            <Link href="/admin/companies/new" className="inline-block mt-4">
              <Button size="sm">Add Your First Company</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog !== null}
        onClose={() => setShowDeleteDialog(null)}
        onConfirm={handleConfirmDeleteCompany}
        title="Delete Company"
        description={`Are you sure you want to delete "${showDeleteDialog?.name}"? This will also delete all associated jobs.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deletingCompanyId !== null}
      />
    </div>
  );
}

