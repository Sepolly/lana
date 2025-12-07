"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { Shield, CheckCircle, XCircle, Award, User, BookOpen, Calendar, Hash } from "lucide-react";
import Link from "next/link";

interface CertificateData {
  id: string;
  certificateNumber: string;
  level: string;
  examScore: number;
  issueDate: string;
  course: {
    title: string;
    slug: string;
  };
  recipient: {
    name: string | null;
    email: string;
  };
  blockchainHash: string | null;
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const certificateNumber = params?.certificateNumber as string;

  const [certificate, setCertificate] = React.useState<CertificateData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isValid, setIsValid] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!certificateNumber) return;

    const verifyCertificate = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/certificates/verify/${certificateNumber}`);
        const data = await response.json();

        if (data.success && data.valid) {
          setCertificate(data.certificate);
          setIsValid(true);
        } else {
          setIsValid(false);
          setError(data.error || "Certificate not found");
        }
      } catch (err) {
        setIsValid(false);
        setError("Failed to verify certificate");
      } finally {
        setIsLoading(false);
      }
    };

    verifyCertificate();
  }, [certificateNumber]);

  const levelLabels: Record<string, string> = {
    BRONZE: "Bronze",
    SILVER: "Silver",
    GOLD: "Gold",
    PLATINUM: "Platinum",
  };

  const levelColors: Record<string, string> = {
    BRONZE: "bg-amber-100 text-amber-800 border-amber-300",
    SILVER: "bg-slate-100 text-slate-800 border-slate-300",
    GOLD: "bg-yellow-100 text-yellow-800 border-yellow-300",
    PLATINUM: "bg-purple-100 text-purple-800 border-purple-300",
  };

  if (isLoading) {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-16 text-center">
            <div className="border-primary mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-t-transparent" />
            <p className="text-muted-foreground">Verifying certificate...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid || !certificate) {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-16 text-center">
            <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <XCircle className="text-destructive h-8 w-8" />
            </div>
            <h1 className="text-foreground mb-2 text-2xl font-bold">Certificate Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "The certificate number you provided could not be verified."}
            </p>
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const issueDate = new Date(certificate.issueDate);
  const formattedDate = issueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-muted/30 min-h-screen py-8">
      <div className="mx-auto max-w-4xl space-y-6 px-4">
        {/* Verification Status */}
        <Card className="border-success border-2">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="bg-success/10 flex h-16 w-16 items-center justify-center rounded-full">
                <CheckCircle className="text-success h-8 w-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-foreground mb-1 text-2xl font-bold">Certificate Verified</h1>
                <p className="text-muted-foreground">
                  This certificate has been verified and is authentic
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificate Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="text-primary h-5 w-5" />
              Certificate Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recipient */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <User className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Recipient</p>
                  <p className="text-foreground font-semibold">
                    {certificate.recipient.name || certificate.recipient.email}
                  </p>
                  {certificate.recipient.name && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {certificate.recipient.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <BookOpen className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Course</p>
                  <p className="text-foreground font-semibold">{certificate.course.title}</p>
                  <Link
                    href={`/courses/${certificate.course.slug}`}
                    className="text-primary mt-1 inline-block text-xs hover:underline"
                  >
                    View Course
                  </Link>
                </div>
              </div>
            </div>

            {/* Certificate Info */}
            <div className="grid grid-cols-1 gap-6 border-t pt-6 md:grid-cols-3">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Certificate Number</p>
                <p className="text-foreground font-mono text-sm font-semibold">
                  {certificate.certificateNumber}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground mb-1 text-sm">Level</p>
                <span
                  className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${
                    levelColors[certificate.level] || levelColors.BRONZE
                  }`}
                >
                  {levelLabels[certificate.level]}
                </span>
              </div>

              <div>
                <p className="text-muted-foreground mb-1 text-sm">Exam Score</p>
                <p className="text-foreground text-lg font-semibold">
                  {Math.round(certificate.examScore)}%
                </p>
              </div>
            </div>

            {/* Issue Date */}
            <div className="flex items-start gap-3 border-t pt-6">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <Calendar className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Date of Issue</p>
                <p className="text-foreground font-semibold">{formattedDate}</p>
              </div>
            </div>

            {/* Blockchain Verification */}
            {certificate.blockchainHash && (
              <div className="flex items-start gap-3 border-t pt-6">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <Hash className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Blockchain Hash</p>
                  <p className="text-foreground font-mono text-xs break-all">
                    {certificate.blockchainHash}
                  </p>
                </div>
              </div>
            )}

            {/* Official Notice */}
            <div className="bg-muted/50 rounded-lg border-t p-4 pt-6">
              <div className="flex items-start gap-3">
                <Shield className="text-primary mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-foreground mb-1 text-sm font-semibold">
                    Official Verification
                  </p>
                  <p className="text-muted-foreground text-xs">
                    This certificate is issued by the Ministry of Technical and Higher Education and
                    the Ministry of Communication and Technology Information, Republic of Sierra
                    Leone. The information displayed above has been verified and is authentic.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Link href="/">
            <Button variant="outline">Return to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
