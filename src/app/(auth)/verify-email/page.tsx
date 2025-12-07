"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, CardContent, Spinner, Mascot } from "@/components/ui";
import { CheckCircle2, XCircle, Mail, ArrowRight } from "lucide-react";

type VerificationStatus = "loading" | "success" | "error" | "no-token";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = React.useState<VerificationStatus>(token ? "loading" : "no-token");
  const [message, setMessage] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [isResending, setIsResending] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;

    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    };

    verifyEmail();
  }, [token]);

  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendSuccess(true);
      }
    } catch {
      // Silent fail - we don't want to reveal if email exists
    } finally {
      setIsResending(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <Card variant="elevated" className="animate-fade-in">
        <CardContent className="space-y-6 py-12 text-center">
          <Spinner size="xl" />
          <div>
            <h2 className="text-foreground text-xl font-semibold">Verifying your email...</h2>
            <p className="text-muted-foreground mt-2">
              Please wait while we verify your email address.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <Card variant="elevated" className="animate-fade-in">
        <CardContent className="space-y-6 py-8 text-center">
          <Mascot size="lg" mood="celebrating" animate={false} />

          <div className="bg-success/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <CheckCircle2 className="text-success h-8 w-8" />
          </div>

          <div>
            <h2 className="text-foreground text-2xl font-bold">Email Verified!</h2>
            <p className="text-muted-foreground mt-2">{message}</p>
          </div>

          <Button
            onClick={() => router.push("/login")}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Continue to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <Card variant="elevated" className="animate-fade-in">
        <CardContent className="space-y-6 py-8 text-center">
          <Mascot size="lg" mood="thinking" animate={false} />

          <div className="bg-destructive/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <XCircle className="text-destructive h-8 w-8" />
          </div>

          <div>
            <h2 className="text-foreground text-2xl font-bold">Verification Failed</h2>
            <p className="text-muted-foreground mt-2">{message}</p>
          </div>

          <div className="mx-auto w-full max-w-xs space-y-4">
            <p className="text-muted-foreground text-sm">Need a new verification link?</p>

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-border bg-input focus:ring-primary h-11 flex-1 rounded-xl border px-4 text-sm focus:ring-2 focus:outline-none"
              />
              <Button onClick={handleResend} isLoading={isResending} disabled={!email}>
                Resend
              </Button>
            </div>

            {resendSuccess && (
              <p className="text-success text-sm">
                If an account exists, a new verification email has been sent.
              </p>
            )}
          </div>

          <div className="pt-4">
            <Link href="/login" className="text-primary text-sm hover:underline">
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No token state - show instructions
  return (
    <Card variant="elevated" className="animate-fade-in">
      <CardContent className="space-y-6 py-8 text-center">
        <Mascot size="lg" mood="happy" animate={false} />

        <div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <Mail className="text-primary h-8 w-8" />
        </div>

        <div>
          <h2 className="text-foreground text-2xl font-bold">Check Your Email</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-sm">
            We&apos;ve sent you a verification email. Click the link in the email to verify your
            account.
          </p>
        </div>

        <div className="mx-auto w-full max-w-xs space-y-4">
          <p className="text-muted-foreground text-sm">Didn&apos;t receive the email?</p>

          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-border bg-input focus:ring-primary h-11 flex-1 rounded-xl border px-4 text-sm focus:ring-2 focus:outline-none"
            />
            <Button onClick={handleResend} isLoading={isResending} disabled={!email}>
              Resend
            </Button>
          </div>

          {resendSuccess && (
            <p className="text-success text-sm">
              If an account exists, a new verification email has been sent.
            </p>
          )}
        </div>

        <div className="space-y-2 pt-4">
          <p className="text-muted-foreground text-xs">Make sure to check your spam folder</p>
          <Link href="/login" className="text-primary inline-block text-sm hover:underline">
            Back to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <Card variant="elevated" className="animate-fade-in">
          <CardContent className="flex justify-center py-12">
            <Spinner size="lg" />
          </CardContent>
        </Card>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}
