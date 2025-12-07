import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CertificateView } from "@/components/certificate-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CertificateDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const certificate = await db.certificate.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          title: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!certificate) {
    notFound();
  }

  // Verify ownership
  if (certificate.userId !== session.user.id) {
    redirect("/certificates");
  }

  // Generate verification URL
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verificationUrl = `${baseUrl}/verify/${certificate.certificateNumber}`;

  return (
    <div className="bg-muted/30 min-h-screen py-8">
      <div className="mx-auto max-w-5xl px-4">
        <CertificateView certificate={certificate} verificationUrl={verificationUrl} />
      </div>
    </div>
  );
}
