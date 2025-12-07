import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, Mascot, Button } from "@/components/ui";
import { Award, Download, ExternalLink, Shield } from "lucide-react";
import Link from "next/link";
import { PendingCertificates } from "./pending-certificates";


export default async function CertificatesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const certificates = await db.certificate.findMany({
    where: {
      userId: session.user.id,
    },
    include: { course: true },
    orderBy: { issueDate: "desc" },
  });

  // Filter out certificates with null courses (in case course was deleted)
  const validCertificates = certificates.filter((cert) => cert.course !== null);

  // Get all completed and passed exams without certificates
  const examSchedules = await db.examSchedule.findMany({
    where: {
      userId: session.user.id,
      status: "COMPLETED",
      passed: true,
      NOT: {
        courseId: {
          in: validCertificates.map(cert => cert.courseId)
        }
      }
    },
    orderBy: { completedAt: "desc" },
  });

  // Fetch course data separately
  const passedExamsWithoutCertificates = await Promise.all(
    examSchedules.map(async (exam) => {
      const course = await db.course.findUnique({
        where: { id: exam.courseId },
        select: { id: true, title: true }
      });
      return {
        ...exam,
        course: course || { id: exam.courseId, title: 'Unknown Course' }
      };
    })
  );

  const levelColors: Record<string, string> = {
    BRONZE: "bg-amber-100 text-amber-800 border-amber-300",
    SILVER: "bg-slate-100 text-slate-800 border-slate-300",
    GOLD: "bg-yellow-100 text-yellow-800 border-yellow-300",
    PLATINUM: "bg-purple-100 text-purple-800 border-purple-300",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Certificates</h1>
        <p className="text-muted-foreground mt-1">
          View and download your earned certificates
        </p>
      </div>

      {/* Pending Certificates Section */}
      {passedExamsWithoutCertificates.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Pending Certificates</h2>
            <p className="text-muted-foreground text-sm">
              You have passed exams that certificates haven&apos;t been generated for yet.
            </p>
          </div>
          <PendingCertificates exams={passedExamsWithoutCertificates} />
        </div>
      )}

      {validCertificates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Mascot size="xl" mood="thinking" animate={false} />
            <h2 className="text-xl font-semibold text-foreground mt-6">
              No Certificates Yet
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Complete courses and pass the final exams to earn certificates that are 
              verified on the blockchain and recognized by government bodies.
            </p>
            <Link href="/courses" className="inline-block mt-6">
              <Button>Browse Courses</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {validCertificates.map((cert) => (
              <Card key={cert.id} className="overflow-hidden">
                {/* Certificate Preview */}
                <div className="h-48 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 flex flex-col justify-between text-white relative overflow-hidden">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-6 h-6" />
                        <span className="font-semibold">Certificate of Completion</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${levelColors[cert.level] || levelColors.BRONZE}`}>
                        {cert.level}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <p className="text-lg font-bold">{cert.course.title}</p>
                    <p className="text-white/80 text-sm mt-1">
                      Issued to {session.user.name || session.user.email}
                    </p>
                  </div>
                </div>

              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Certificate ID</p>
                      <p className="font-mono text-foreground">{cert.certificateNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Exam Score</p>
                      <p className="font-semibold text-foreground">{cert.examScore}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Issue Date</p>
                      <p className="text-foreground">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Verification</p>
                      {cert.blockchainHash ? (
                        <div className="flex items-center gap-1 text-success">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm">Verified</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/certificates/${cert.id}`} className="flex-1">
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        leftIcon={<Award className="w-4 h-4" />}
                      >
                        View Certificate
                      </Button>
                    </Link>
                    {cert.blockchainHash && (
                      <Link href={`/verify/${cert.certificateNumber}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          fullWidth
                          leftIcon={<ExternalLink className="w-4 h-4" />}
                        >
                          Verify
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info about certificates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-tertiary/30">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Blockchain-Verified Certificates
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  All certificates are signed by the Ministry of Technical and Higher Education 
                  and the Ministry of Communication and Technology Information. Each certificate 
                  has a unique blockchain hash that can be verified by employers and institutions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/30">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Verify Certificates
                </h3>
                <p className="text-muted-foreground text-sm mt-1 mb-4">
                  Verify the authenticity of any certificate by scanning its QR code or entering the certificate number.
                </p>
                <Link href="/verify">
                  <Button size="sm" variant="outline">
                    Go to Verification Portal
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

