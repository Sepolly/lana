"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  Spinner,
  Mascot,
} from "@/components/ui";
import { CheckCircle2, XCircle, Mail, ArrowRight } from "lucide-react";

type VerificationStatus = "loading" | "success" | "error" | "no-token";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = React.useState<VerificationStatus>(
    token ? "loading" : "no-token"
  );
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
        <CardContent className="py-12 text-center space-y-6">
          <Spinner size="xl" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Verifying your email...
            </h2>
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
        <CardContent className="py-8 text-center space-y-6">
          <Mascot size="lg" mood="celebrating" animate={false} />
          
          <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Email Verified!
            </h2>
            <p className="text-muted-foreground mt-2">{message}</p>
          </div>

          <Button
            onClick={() => router.push("/login")}
            rightIcon={<ArrowRight className="w-4 h-4" />}
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
        <CardContent className="py-8 text-center space-y-6">
          <Mascot size="lg" mood="thinking" animate={false} />
          
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Verification Failed
            </h2>
            <p className="text-muted-foreground mt-2">{message}</p>
          </div>

          <div className="space-y-4 w-full max-w-xs mx-auto">
            <p className="text-sm text-muted-foreground">
              Need a new verification link?
            </p>
            
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-11 px-4 rounded-xl border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={handleResend}
                isLoading={isResending}
                disabled={!email}
              >
                Resend
              </Button>
            </div>

            {resendSuccess && (
              <p className="text-sm text-success">
                If an account exists, a new verification email has been sent.
              </p>
            )}
          </div>

          <div className="pt-4">
            <Link
              href="/login"
              className="text-sm text-primary hover:underline"
            >
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
      <CardContent className="py-8 text-center space-y-6">
        <Mascot size="lg" mood="happy" animate={false} />
        
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Check Your Email
          </h2>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            We&apos;ve sent you a verification email. Click the link in the email to
            verify your account.
          </p>
        </div>

        <div className="space-y-4 w-full max-w-xs mx-auto">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email?
          </p>
          
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-11 px-4 rounded-xl border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              onClick={handleResend}
              isLoading={isResending}
              disabled={!email}
            >
              Resend
            </Button>
          </div>

          {resendSuccess && (
            <p className="text-sm text-success">
              If an account exists, a new verification email has been sent.
            </p>
          )}
        </div>

        <div className="pt-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            Make sure to check your spam folder
          </p>
          <Link
            href="/login"
            className="text-sm text-primary hover:underline inline-block"
          >
            Back to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={
      <Card variant="elevated" className="animate-fade-in">
        <CardContent className="py-12 flex justify-center">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    }>
      <VerifyEmailContent />
    </React.Suspense>
  );
}
