import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Award, User, BookOpen, Calendar, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminCertificatesPage() {
  const certificates = await db.certificate.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
    orderBy: { issueDate: "desc" },
  });

  const stats = {
    total: certificates.length,
    bronze: certificates.filter((c) => c.level === "BRONZE").length,
    silver: certificates.filter((c) => c.level === "SILVER").length,
    gold: certificates.filter((c) => c.level === "GOLD").length,
    platinum: certificates.filter((c) => c.level === "PLATINUM").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground text-3xl font-bold">Certificates</h1>
        <p className="text-muted-foreground mt-1">View and verify all issued certificates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <Award className="text-primary h-6 w-6" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">{stats.total}</p>
                <p className="text-muted-foreground text-sm">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">{stats.bronze}</p>
                <p className="text-muted-foreground text-sm">Bronze</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                <Award className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">{stats.silver}</p>
                <p className="text-muted-foreground text-sm">Silver</p>
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
                <p className="text-foreground text-2xl font-bold">{stats.gold}</p>
                <p className="text-muted-foreground text-sm">Gold</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">{stats.platinum}</p>
                <p className="text-muted-foreground text-sm">Platinum</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificates Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Certificates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-border border-b">
                  <th className="text-muted-foreground p-4 text-left font-medium">User</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Course</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Level</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Score</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Certificate #</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Issued</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full">
                          <span className="text-secondary-foreground text-sm font-bold">
                            {cert.user.name?.charAt(0) || cert.user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-foreground font-medium">
                            {cert.user.name || "No name"}
                          </p>
                          <p className="text-muted-foreground text-sm">{cert.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/courses/${cert.course.slug}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {cert.course.title}
                      </Link>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          cert.level === "PLATINUM"
                            ? "bg-purple-100 text-purple-800"
                            : cert.level === "GOLD"
                              ? "bg-yellow-100 text-yellow-800"
                              : cert.level === "SILVER"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {cert.level}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-foreground font-medium">
                        {Math.round(cert.examScore)}%
                      </span>
                    </td>
                    <td className="p-4">
                      <code className="bg-muted rounded px-2 py-1 text-xs">
                        {cert.certificateNumber}
                      </code>
                    </td>
                    <td className="p-4">
                      <span className="text-muted-foreground flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      {cert.blockchainHash ? (
                        <span className="text-success flex items-center gap-1 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1 text-sm">
                          <XCircle className="h-4 w-4" />
                          Not Verified
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {certificates.length === 0 && (
            <div className="py-12 text-center">
              <Award className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">No certificates issued yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
