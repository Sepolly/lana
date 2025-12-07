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
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying certificate...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid || !certificate) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Certificate Not Found</h1>
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
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Verification Status */}
        <Card className="border-2 border-success">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-1">Certificate Verified</h1>
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
              <Award className="w-5 h-5 text-primary" />
              Certificate Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recipient */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Recipient</p>
                  <p className="font-semibold text-foreground">
                    {certificate.recipient.name || certificate.recipient.email}
                  </p>
                  {certificate.recipient.name && (
                    <p className="text-xs text-muted-foreground mt-1">{certificate.recipient.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Course</p>
                  <p className="font-semibold text-foreground">{certificate.course.title}</p>
                  <Link
                    href={`/courses/${certificate.course.slug}`}
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    View Course
                  </Link>
                </div>
              </div>
            </div>

            {/* Certificate Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Certificate Number</p>
                <p className="font-mono font-semibold text-foreground text-sm">
                  {certificate.certificateNumber}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Level</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${
                    levelColors[certificate.level] || levelColors.BRONZE
                  }`}
                >
                  {levelLabels[certificate.level]}
                </span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Exam Score</p>
                <p className="font-semibold text-foreground text-lg">
                  {Math.round(certificate.examScore)}%
                </p>
              </div>
            </div>

            {/* Issue Date */}
            <div className="flex items-start gap-3 pt-6 border-t">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Date of Issue</p>
                <p className="font-semibold text-foreground">{formattedDate}</p>
              </div>
            </div>

            {/* Blockchain Verification */}
            {certificate.blockchainHash && (
              <div className="flex items-start gap-3 pt-6 border-t">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Hash className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Blockchain Hash</p>
                  <p className="font-mono text-xs text-foreground break-all">
                    {certificate.blockchainHash}
                  </p>
                </div>
              </div>
            )}

            {/* Official Notice */}
            <div className="pt-6 border-t bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Official Verification
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This certificate is issued by the Ministry of Technical and Higher Education and
                    the Ministry of Communication and Technology Information, Republic of Sierra Leone.
                    The information displayed above has been verified and is authentic.
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

