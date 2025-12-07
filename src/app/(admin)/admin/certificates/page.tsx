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
        <h1 className="text-3xl font-bold text-foreground">Certificates</h1>
        <p className="text-muted-foreground mt-1">
          View and verify all issued certificates
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.bronze}</p>
                <p className="text-sm text-muted-foreground">Bronze</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.silver}</p>
                <p className="text-sm text-muted-foreground">Silver</p>
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
                <p className="text-2xl font-bold text-foreground">{stats.gold}</p>
                <p className="text-sm text-muted-foreground">Gold</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.platinum}</p>
                <p className="text-sm text-muted-foreground">Platinum</p>
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
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Course</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Level</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Score</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Certificate #</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Issued</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-sm font-bold text-secondary-foreground">
                            {cert.user.name?.charAt(0) || cert.user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{cert.user.name || "No name"}</p>
                          <p className="text-sm text-muted-foreground">{cert.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/courses/${cert.course.slug}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {cert.course.title}
                      </Link>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        cert.level === "PLATINUM" ? "bg-purple-100 text-purple-800" :
                        cert.level === "GOLD" ? "bg-yellow-100 text-yellow-800" :
                        cert.level === "SILVER" ? "bg-gray-100 text-gray-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {cert.level}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-foreground">{Math.round(cert.examScore)}%</span>
                    </td>
                    <td className="p-4">
                      <code className="text-xs bg-muted px-2 py-1 rounded">{cert.certificateNumber}</code>
                    </td>
                    <td className="p-4">
                      <span className="text-muted-foreground text-sm flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      {cert.blockchainHash ? (
                        <span className="flex items-center gap-1 text-success text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground text-sm">
                          <XCircle className="w-4 h-4" />
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
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No certificates issued yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

