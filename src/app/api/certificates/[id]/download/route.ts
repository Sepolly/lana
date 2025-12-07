import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ success: false, error: "Certificate not found" }, { status: 404 });
    }

    // Verify ownership
    if (certificate.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Generate verification URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verify/${certificate.certificateNumber}`;

    // Generate HTML for certificate
    const levelLabels: Record<string, string> = {
      BRONZE: "Bronze",
      SILVER: "Silver",
      GOLD: "Gold",
      PLATINUM: "Platinum",
    };

    const levelColors: Record<string, { border: string; text: string; bg: string }> = {
      BRONZE: {
        border: "#CD7F32",
        text: "#CD7F32",
        bg: "#FFF8E7",
      },
      SILVER: {
        border: "#C0C0C0",
        text: "#808080",
        bg: "#F5F5F5",
      },
      GOLD: {
        border: "#FFD700",
        text: "#B8860B",
        bg: "#FFFACD",
      },
      PLATINUM: {
        border: "#E5E4E2",
        text: "#8B7D6B",
        bg: "#F8F8FF",
      },
    };

    const levelColor = levelColors[certificate.level] || levelColors.BRONZE;
    const issueDate = new Date(certificate.issueDate);
    const formattedDate = issueDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Create HTML string for certificate
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Open+Sans:wght@400;600;700&display=swap');
            body {
              margin: 0;
              padding: 0;
              font-family: 'Open Sans', sans-serif;
            }
            .certificate {
              width: 297mm;
              height: 210mm;
              background: ${levelColor.bg};
              border: 4mm solid ${levelColor.border};
              padding: 16mm;
              box-sizing: border-box;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid ${levelColor.border};
              padding-bottom: 8mm;
              margin-bottom: 8mm;
            }
            .seal-container {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 20mm;
              margin-bottom: 6mm;
            }
            .seal {
              width: 20mm;
              height: 20mm;
              border: 2px solid ${levelColor.border};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .ministry-name {
              font-family: 'Playfair Display', serif;
              font-size: 24pt;
              font-weight: 900;
              color: ${levelColor.text};
              margin: 0;
            }
            .ministry-sub {
              font-size: 14pt;
              font-weight: 600;
              color: ${levelColor.text};
              margin: 2mm 0;
            }
            .cert-title {
              font-family: 'Playfair Display', serif;
              font-size: 28pt;
              font-weight: 700;
              color: ${levelColor.text};
              margin: 4mm 0;
              letter-spacing: 2px;
            }
            .content {
              text-align: center;
              padding: 8mm 0;
            }
            .student-name {
              font-family: 'Playfair Display', serif;
              font-size: 32pt;
              font-weight: 700;
              color: ${levelColor.text};
              margin: 4mm 0;
              border-bottom: 1px solid ${levelColor.border};
              display: inline-block;
              padding-bottom: 2mm;
            }
            .course-title {
              font-size: 20pt;
              font-weight: 600;
              color: #333;
              margin: 4mm 0;
              font-style: italic;
            }
            .score {
              font-size: 24pt;
              font-weight: 700;
              color: ${levelColor.text};
            }
            .level-badge {
              display: inline-block;
              padding: 3mm 6mm;
              border: 2px solid ${levelColor.border};
              border-radius: 20px;
              color: ${levelColor.text};
              background: white;
              font-weight: 600;
              font-size: 14pt;
              margin: 4mm 0;
            }
            .footer {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 8mm;
              padding-top: 8mm;
              border-top: 2px solid ${levelColor.border};
              margin-top: 8mm;
            }
            .footer-item {
              text-align: center;
            }
            .footer-label {
              font-size: 10pt;
              color: #666;
              margin-bottom: 2mm;
            }
            .footer-value {
              font-weight: 600;
              color: #333;
            }
            .qr-code {
              width: 24mm;
              height: 24mm;
              border: 1px solid ${levelColor.border};
              padding: 1mm;
              background: white;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12mm;
              padding-top: 8mm;
              border-top: 2px solid ${levelColor.border};
              margin-top: 8mm;
            }
            .signature {
              text-align: center;
            }
            .signature-line {
              height: 16mm;
              border-bottom: 2px solid ${levelColor.border};
              margin-bottom: 2mm;
            }
            .signature-name {
              font-weight: 600;
              font-size: 11pt;
              color: #333;
            }
            .signature-title {
              font-size: 9pt;
              color: #666;
              margin-top: 1mm;
            }
            .verification-notice {
              text-align: center;
              padding: 4mm;
              margin-top: 6mm;
              background: rgba(255, 255, 255, 0.8);
              border: 1px solid ${levelColor.border};
              border-radius: 4px;
            }
            .verification-notice-text {
              font-size: 9pt;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <div class="seal-container">
                <div class="seal">⚜</div>
                <div>
                  <h1 class="ministry-name">REPUBLIC OF SIERRA LEONE</h1>
                  <p class="ministry-sub">Ministry of Technical and Higher Education</p>
                  <p class="ministry-sub" style="font-size: 12pt;">Ministry of Communication and Technology Information</p>
                </div>
                <div class="seal">🏆</div>
              </div>
              <h2 class="cert-title">CERTIFICATE OF COMPLETION</h2>
            </div>
            
            <div class="content">
              <p style="font-size: 14pt; color: #555; margin-bottom: 4mm;">This is to certify that</p>
              
              <div class="student-name">${certificate.user.name || certificate.user.email}</div>
              
              <p style="font-size: 14pt; color: #555; margin: 4mm 0;">has successfully completed the course</p>
              
              <div class="course-title">${certificate.course.title}</div>
              
              <p style="font-size: 14pt; color: #555; margin: 4mm 0;">
                with a final examination score of <span class="score">${Math.round(certificate.examScore)}%</span>
              </p>
              
              <div class="level-badge">${levelLabels[certificate.level]} Level Achievement</div>
            </div>
            
            <div class="footer">
              <div class="footer-item">
                <div class="footer-label">Date of Issue</div>
                <div class="footer-value">${formattedDate}</div>
              </div>
              <div class="footer-item">
                <div class="footer-label">Certificate Number</div>
                <div class="footer-value" style="font-family: monospace; font-size: 10pt;">${certificate.certificateNumber}</div>
              </div>
              <div class="footer-item">
                <div class="footer-label">Verification Code</div>
                <div class="footer-value" style="font-size: 8pt; word-break: break-all;">${verificationUrl}</div>
              </div>
            </div>
            
            <div class="signatures">
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-name">Minister of Technical and Higher Education</div>
                <div class="signature-title">Republic of Sierra Leone</div>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-name">Minister of Communication and Technology</div>
                <div class="signature-title">Republic of Sierra Leone</div>
              </div>
            </div>
            
            <div class="verification-notice">
              <p class="verification-notice-text">✓ This certificate can be verified by scanning the QR code or visiting the verification portal</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Return certificate data for client-side PDF generation
    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        level: certificate.level,
        examScore: certificate.examScore,
        issueDate: certificate.issueDate,
        course: certificate.course,
        user: certificate.user,
      },
      verificationUrl,
    });
  } catch (error) {
    console.error("Certificate download error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
