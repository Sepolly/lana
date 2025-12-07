"use client";

import * as React from "react";
import { Award, Download } from "lucide-react";
import { Button } from "@/components/ui";

// LANA Brand Colors
const LANA_COLORS = {
  primary: "#162660", // Royal Blue
  secondary: "#D0E6FD", // Powder Blue
  tertiary: "#F1E4D1", // Warm Beige
  background: "#f8fafc",
  foreground: "#162660",
};

interface CertificateViewProps {
  certificate: {
    id: string;
    certificateNumber: string;
    level: string;
    examScore: number;
    issueDate: Date | string;
    course: {
      title: string;
    };
    user: {
      name: string | null;
      email: string;
    };
  };
  verificationUrl: string;
}

export function CertificateView({ certificate, verificationUrl }: CertificateViewProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>("");
  const [isQRCodeReady, setIsQRCodeReady] = React.useState<boolean>(false);
  const certificateRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Generate QR code client-side
    const generateQR = async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(verificationUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: LANA_COLORS.primary,
            light: "#FFFFFF",
          },
        });
        setQrCodeDataUrl(url);
        setIsQRCodeReady(true);
      } catch (err) {
        console.error("QR code generation error:", err);
        setIsQRCodeReady(true); // Set to true even on error to allow PDF generation
      }
    };
    generateQR();
  }, [verificationUrl]);

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;

    const button = document.querySelector("[data-pdf-button]") as HTMLButtonElement;
    const originalButtonText = button?.textContent || "Download PDF";

    try {
      // Show loading state
      if (button) {
        button.disabled = true;
        button.textContent = "Generating PDF...";
      }

      // Wait for QR code to be ready and ensure all images are loaded
      if (!isQRCodeReady) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Wait for all images to load
      const images = certificateRef.current.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even if image fails
            setTimeout(resolve, 2000); // Timeout after 2 seconds
          });
        })
      );

      // Additional wait to ensure rendering is complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Dynamic import to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      // Helper function to convert any color format to hex
      const colorToHex = (color: string): string => {
        if (!color || color === "transparent" || color === "none") return "#FFFFFF";

        // If already hex, return as is
        if (color.startsWith("#")) return color;

        // If rgb/rgba, convert to hex
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
          const g = parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
          const b = parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
          return `#${r}${g}${b}`;
        }

        // For lab(), oklch(), or other unsupported formats, return white
        if (color.includes("lab(") || color.includes("oklch(") || color.includes("lch(")) {
          return "#FFFFFF";
        }

        return color;
      };

      // Get actual certificate dimensions to preserve aspect ratio
      const certElement = certificateRef.current;
      const certWidth = certElement.offsetWidth || certElement.scrollWidth;
      const certHeight = certElement.offsetHeight || certElement.scrollHeight;

      const canvas = await html2canvas(certElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#FFFFFF",
        width: certWidth,
        height: certHeight,
        windowWidth: certWidth,
        windowHeight: certHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        removeContainer: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Ensure all images are loaded in the cloned document
          const clonedImages = clonedDoc.querySelectorAll("img");
          clonedImages.forEach((img) => {
            if (!img.complete) {
              img.style.display = "none";
            }
          });

          // Convert all computed styles to avoid lab() color issues
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const computedStyle = window.getComputedStyle(htmlEl);

            // Convert background color
            const bgColor = computedStyle.backgroundColor;
            if (bgColor && (bgColor.includes("lab(") || bgColor.includes("oklch("))) {
              htmlEl.style.backgroundColor = colorToHex(bgColor);
            }

            // Convert border color
            const borderColor = computedStyle.borderColor;
            if (borderColor && (borderColor.includes("lab(") || borderColor.includes("oklch("))) {
              htmlEl.style.borderColor = colorToHex(borderColor);
            }

            // Convert color
            const textColor = computedStyle.color;
            if (textColor && (textColor.includes("lab(") || textColor.includes("oklch("))) {
              htmlEl.style.color = colorToHex(textColor);
            }
          });
        },
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

      // Validate image data
      if (!imgData || imgData === "data:,") {
        throw new Error("Failed to generate image data");
      }

      // Calculate PDF dimensions preserving exact aspect ratio from canvas
      // Use canvas dimensions to maintain exact proportions
      const canvasAspectRatio = canvas.width / canvas.height;

      // A4 landscape: 297mm x 210mm (aspect ratio ~1.414)
      // Use A4 landscape as base, but preserve exact certificate aspect ratio
      const a4LandscapeRatio = 297 / 210;

      let pdfWidth: number;
      let pdfHeight: number;

      // Preserve the exact aspect ratio from the canvas
      // If certificate aspect ratio matches or is close to A4 landscape, use A4
      if (Math.abs(canvasAspectRatio - a4LandscapeRatio) < 0.1) {
        pdfWidth = 297;
        pdfHeight = 210;
      } else {
        // Calculate dimensions preserving exact aspect ratio
        // Fit to A4 landscape while maintaining aspect ratio
        if (canvasAspectRatio > a4LandscapeRatio) {
          // Wider than A4, fit to width
          pdfWidth = 297;
          pdfHeight = 297 / canvasAspectRatio;
        } else {
          // Taller than A4, fit to height
          pdfHeight = 210;
          pdfWidth = 210 * canvasAspectRatio;
        }
      }

      // Create PDF with exact dimensions to preserve aspect ratio
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight], // Custom dimensions matching certificate
      });

      // Add image at full size preserving exact aspect ratio (no scaling/distortion)
      try {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      } catch (imgError) {
        // If addImage fails, try without compression
        console.warn("First addImage attempt failed, trying alternative method:", imgError);
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`LANA-Certificate-${certificate.certificateNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Full error details:", error);
      alert(`Failed to generate PDF: ${errorMessage}. Please check the console for details.`);
    } finally {
      // Reset button state
      if (button) {
        button.disabled = false;
        button.textContent = originalButtonText;
      }
    }
  };

  const issueDate = new Date(certificate.issueDate);
  const formattedDate = issueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate performance tier for visual gamification
  const score = Math.round(certificate.examScore);
  const getPerformanceTier = (score: number) => {
    if (score >= 90)
      return {
        label: "Exceptional",
        color: "#10B981",
      };
    if (score >= 80)
      return {
        label: "Excellent",
        color: "#3B82F6",
      };
    if (score >= 70)
      return {
        label: "Very Good",
        color: "#8B5CF6",
      };
    if (score >= 60)
      return {
        label: "Good",
        color: "#F59E0B",
      };
    return {
      label: "Satisfactory",
      color: "#EF4444",
    };
  };

  const performanceTier = getPerformanceTier(score);

  return (
    <div className="space-y-6">
      {/* Download Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleDownloadPDF}
          leftIcon={<Download className="h-4 w-4" />}
          data-pdf-button
        >
          Download PDF
        </Button>
      </div>

      {/* Certificate - Landscape with LANA Branding */}
      <div
        ref={certificateRef}
        className="relative mx-auto w-full overflow-hidden border-4 bg-white shadow-2xl"
        style={{
          aspectRatio: "297 / 210", // A4 landscape aspect ratio
          maxWidth: "297mm",
          minHeight: "210mm",
          borderColor: LANA_COLORS.primary,
        }}
      >
        {/* Top Border Accent */}
        <div className="h-2 w-full" style={{ backgroundColor: LANA_COLORS.primary }} />

        {/* Certificate Number - Top Left Corner */}
        <div className="absolute top-3 left-3 z-20 md:top-4 md:left-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold" style={{ color: LANA_COLORS.primary }}>
              Certificate No.
            </p>
            <p className="max-w-[120px] font-mono text-xs break-all text-gray-700 md:max-w-[150px]">
              {certificate.certificateNumber}
            </p>
          </div>
        </div>

        {/* QR Code - Top Right Corner */}
        <div className="absolute top-3 right-3 z-20 md:top-4 md:right-4">
          <div className="space-y-1">
            <p className="text-center text-xs font-semibold" style={{ color: LANA_COLORS.primary }}>
              Verify
            </p>
            {qrCodeDataUrl ? (
              <div
                className="rounded-lg border-2 p-1"
                style={{
                  borderColor: LANA_COLORS.secondary,
                  backgroundColor: "white",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeDataUrl}
                  alt="Verification QR Code"
                  className="h-16 w-16 md:h-20 md:w-20"
                />
              </div>
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-lg border-2 md:h-20 md:w-20"
                style={{
                  borderColor: LANA_COLORS.secondary,
                  backgroundColor: "white",
                }}
              >
                <div
                  className="h-8 w-8 rounded border-2 border-dashed"
                  style={{ borderColor: LANA_COLORS.secondary }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 opacity-5">
          <div
            className="h-full w-full rounded-full blur-3xl"
            style={{ backgroundColor: LANA_COLORS.primary }}
          />
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 opacity-5">
          <div
            className="h-full w-full rounded-full blur-3xl"
            style={{ backgroundColor: LANA_COLORS.secondary }}
          />
        </div>

        {/* Certificate Content - Optimized for Landscape */}
        <div
          className="relative z-10 flex flex-col p-6 md:p-8 lg:p-10"
          style={{ minHeight: "calc(210mm - 8px)" }}
        >
          {/* Header Section with LANA Logo */}
          <div
            className="flex shrink-0 flex-col items-center space-y-4 border-b-2 pb-5"
            style={{ borderColor: LANA_COLORS.secondary }}
          >
            {/* LANA Logo */}
            <div className="flex items-center justify-center">
              <div className="relative flex h-28 w-28 items-center justify-center md:h-36 md:w-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/lana_logo.jpg"
                  alt="LANA Logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            {/* Certificate Title */}
            <div className="space-y-2 text-center">
              <h1
                className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
                style={{ color: LANA_COLORS.primary }}
              >
                Certificate of Completion
              </h1>
              <div className="flex items-center justify-center gap-3">
                <div
                  className="h-0.5 w-16 md:w-20"
                  style={{ backgroundColor: LANA_COLORS.secondary }}
                />
                <Award className="h-4 w-4 md:h-5 md:w-5" style={{ color: LANA_COLORS.primary }} />
                <div
                  className="h-0.5 w-16 md:w-20"
                  style={{ backgroundColor: LANA_COLORS.secondary }}
                />
              </div>
            </div>
          </div>

          {/* Main Content Section - Centered */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center space-y-5 py-4 text-center">
            <p className="text-sm leading-relaxed text-gray-600 md:text-base">
              This is to certify that
            </p>

            {/* Student Name - Prominent */}
            <div className="py-2">
              <h2
                className="text-2xl font-bold tracking-wide md:text-3xl lg:text-4xl"
                style={{ color: LANA_COLORS.primary }}
              >
                {certificate.user.name || certificate.user.email}
              </h2>
              <div
                className="mx-auto mt-3 h-1 w-48 rounded-full md:w-64 lg:w-80"
                style={{ backgroundColor: LANA_COLORS.secondary }}
              />
            </div>

            <p className="text-sm leading-relaxed text-gray-600 md:text-base">
              has successfully completed the online course
            </p>

            {/* Course Title */}
            <div className="max-w-4xl px-4 py-2">
              <h3
                className="text-xl leading-tight font-semibold md:text-2xl lg:text-3xl"
                style={{ color: LANA_COLORS.foreground }}
              >
                {certificate.course.title}
              </h3>
            </div>

            {/* Visual Performance Indicator - Gamified */}
            <div className="flex flex-col items-center gap-4 pt-4">
              {/* Performance Tier Label */}
              <div
                className="rounded-full border-2 px-6 py-2 text-sm font-bold md:text-base"
                style={{
                  borderColor: performanceTier.color,
                  color: performanceTier.color,
                  backgroundColor: `${performanceTier.color}10`,
                }}
              >
                {performanceTier.label} Performance
              </div>
            </div>

            {/* Date Issued */}
            <div className="pt-2">
              <p className="text-xs text-gray-600 md:text-sm">
                Issued on <span className="font-semibold text-gray-800">{formattedDate}</span>
              </p>
            </div>
          </div>

          {/* Official Signatures Section */}
          <div
            className="mt-auto shrink-0 border-t-2"
            style={{ borderColor: LANA_COLORS.secondary }}
          >
            <div className="grid grid-cols-2 gap-6 md:gap-8">
              {/* Ministry of Technical and Higher Education */}
              <div className="space-y-1.5 text-center">
                <div
                  className="mx-auto mt-8 border-b-2"
                  style={{
                    borderColor: LANA_COLORS.primary,
                    maxWidth: "180px",
                    width: "100%",
                  }}
                />
                <p
                  className="text-xs leading-tight font-semibold"
                  style={{ color: LANA_COLORS.primary }}
                >
                  Minister of Technical and Higher Education
                </p>
                <p className="text-xs text-gray-600">Republic of Sierra Leone</p>
              </div>

              {/* Ministry of Communication and Technology Information */}
              <div className="space-y-1.5 text-center">
                <div
                  className="mx-auto mt-8 mb-1.5 border-b-2"
                  style={{
                    borderColor: LANA_COLORS.primary,
                    maxWidth: "180px",
                    width: "100%",
                  }}
                />
                <p
                  className="text-xs leading-tight font-semibold"
                  style={{ color: LANA_COLORS.primary }}
                >
                  Minister of Communication and Technology Information
                </p>
                <p className="text-xs text-gray-600">Republic of Sierra Leone</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Border Accent */}
        <div className="h-2 w-full" style={{ backgroundColor: LANA_COLORS.primary }} />
      </div>
    </div>
  );
}
