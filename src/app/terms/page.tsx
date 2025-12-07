import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Lana Career Platform Terms of Service - Read our terms and conditions for using our career guidance platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-background min-h-screen py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <FileText className="text-primary h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-3xl">Terms of Service</CardTitle>
                <p className="text-muted-foreground mt-1 text-sm">
                  Last updated:{" "}
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-foreground text-2xl font-bold">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                By accessing and using the Lana Career Platform ("Service"), you accept and agree to
                be bound by the terms and provision of this agreement. If you do not agree to abide
                by the above, please do not use this service.
              </p>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                These Terms of Service ("Terms") govern your access to and use of our website,
                mobile application, and services provided by Lana ("we," "us," or "our").
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">2. Description of Service</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Lana is an AI-powered career guidance platform designed to help users discover their
                career paths through:
              </p>
              <ul className="text-muted-foreground mt-2 ml-6 list-disc space-y-1">
                <li>Aptitude testing and assessment</li>
                <li>Personalized career recommendations</li>
                <li>Educational course offerings</li>
                <li>Job opportunity matching</li>
                <li>Skills development resources</li>
                <li>Certificate generation and verification</li>
              </ul>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">3. User Accounts</h2>

              <h3 className="text-foreground mt-4 text-xl font-semibold">3.1 Account Creation</h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                To use certain features of our Service, you must register for an account. You agree
                to:
              </p>
              <ul className="text-muted-foreground mt-2 ml-6 list-disc space-y-1">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>

              <h3 className="text-foreground mt-4 text-xl font-semibold">
                3.2 Account Eligibility
              </h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                You must be at least 13 years old to use our Service. By using the Service, you
                represent and warrant that you meet this age requirement and have the legal capacity
                to enter into these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">4. User Conduct</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">You agree not to:</p>
              <ul className="text-muted-foreground mt-2 ml-6 list-disc space-y-1">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Violate or infringe upon the rights of others</li>
                <li>Transmit any harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to the Service or related systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Impersonate any person or entity</li>
                <li>Collect or store personal data about other users</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>
                  Use the Service to compete with us or for any commercial purpose without
                  authorization
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">5. Intellectual Property</h2>

              <h3 className="text-foreground mt-4 text-xl font-semibold">5.1 Our Content</h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                The Service and its original content, features, and functionality are owned by Lana
                and are protected by international copyright, trademark, patent, trade secret, and
                other intellectual property laws.
              </p>

              <h3 className="text-foreground mt-4 text-xl font-semibold">5.2 Your Content</h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                You retain ownership of any content you submit, post, or display on or through the
                Service. By submitting content, you grant us a worldwide, non-exclusive,
                royalty-free license to use, reproduce, modify, adapt, publish, and distribute such
                content for the purpose of operating and providing the Service.
              </p>

              <h3 className="text-foreground mt-4 text-xl font-semibold">5.3 Certificates</h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Certificates issued by Lana are the property of Lana and may be revoked if obtained
                fraudulently or if the user violates these Terms. You may not alter, forge, or
                misrepresent certificates.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">
                6. Course Content and Certificates
              </h2>

              <h3 className="text-foreground mt-4 text-xl font-semibold">6.1 Course Access</h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Course content is provided for educational purposes. We reserve the right to modify,
                update, or remove course content at any time. Completion of courses does not
                guarantee employment or career outcomes.
              </p>

              <h3 className="text-foreground mt-4 text-xl font-semibold">6.2 Certificates</h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Certificates are issued upon successful completion of required assessments. We
                reserve the right to verify certificate authenticity and revoke certificates
                obtained through fraudulent means or in violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">7. Job Opportunities</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                We may provide job listings and connect users with potential employers. We are not
                responsible for:
              </p>
              <ul className="text-muted-foreground mt-2 ml-6 list-disc space-y-1">
                <li>The accuracy of job listings posted by employers</li>
                <li>The hiring decisions of employers</li>
                <li>The terms and conditions of employment</li>
                <li>Any disputes between users and employers</li>
              </ul>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                You are solely responsible for evaluating job opportunities and making your own
                decisions regarding employment.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">
                8. Disclaimers and Limitations of Liability
              </h2>

              <h3 className="text-foreground mt-4 text-xl font-semibold">
                8.1 Service Availability
              </h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                We strive to provide reliable service but do not guarantee that the Service will be
                available at all times, uninterrupted, or error-free. We may experience downtime for
                maintenance, updates, or technical issues.
              </p>

              <h3 className="text-foreground mt-4 text-xl font-semibold">8.2 Career Outcomes</h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                While we provide career guidance and recommendations, we do not guarantee specific
                career outcomes, job placements, or salary levels. Career success depends on various
                factors beyond our control.
              </p>

              <h3 className="text-foreground mt-4 text-xl font-semibold">
                8.3 Limitation of Liability
              </h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                To the maximum extent permitted by law, Lana shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages, or any loss of profits or
                revenues, whether incurred directly or indirectly, or any loss of data, use,
                goodwill, or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">9. Indemnification</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                You agree to indemnify, defend, and hold harmless Lana and its officers, directors,
                employees, and agents from and against any claims, liabilities, damages, losses, and
                expenses, including reasonable attorneys' fees, arising out of or in any way
                connected with your access to or use of the Service, your violation of these Terms,
                or your violation of any rights of another.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">10. Termination</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately,
                without prior notice or liability, for any reason, including if you breach these
                Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                You may terminate your account at any time by contacting us or using the account
                deletion feature in your settings. Upon termination, we may delete your account and
                associated data, subject to our data retention policies.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">11. Modifications to Terms</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. If a revision is
                material, we will provide at least 30 days' notice prior to any new terms taking
                effect. What constitutes a material change will be determined at our sole
                discretion.
              </p>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                By continuing to access or use our Service after any revisions become effective, you
                agree to be bound by the revised terms. If you do not agree to the new terms, you
                must stop using the Service.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">12. Governing Law</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of Sierra
                Leone, without regard to its conflict of law provisions. Any disputes arising from
                these Terms or the Service shall be subject to the exclusive jurisdiction of the
                courts of Sierra Leone.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">13. Severability</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                If any provision of these Terms is held to be invalid or unenforceable by a court,
                the remaining provisions of these Terms will remain in effect. These Terms
                constitute the entire agreement between us regarding our Service and supersede and
                replace any prior agreements.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">14. Contact Information</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="text-muted-foreground mt-4 space-y-1">
                <p>
                  <strong>Email:</strong>
                  <a
                    className="hover:text-primary hover:underline"
                    href="mailto:sepolly6@gmail.com"
                  >
                    sepolly6@gmail.com
                  </a>
                </p>
                <p>
                  <strong>Platform:</strong> Lana Career Platform
                </p>
                <p>
                  <strong>Location:</strong> Sierra Leone
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
