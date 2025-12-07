import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Lana Career Platform Privacy Policy - Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
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
                <Shield className="text-primary h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-3xl">Privacy Policy</CardTitle>
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
              <h2 className="text-foreground text-2xl font-bold">1. Introduction</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Welcome to Lana ("we," "our," or "us"). We are committed to protecting your privacy
                and ensuring the security of your personal information. This Privacy Policy explains
                how we collect, use, disclose, and safeguard your information when you use our
                career guidance platform.
              </p>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                By using our service, you agree to the collection and use of information in
                accordance with this policy. If you do not agree with our policies and practices,
                please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">2. Information We Collect</h2>

              <h3 className="text-foreground mt-4 text-xl font-semibold">
                2.1 Personal Information
              </h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="text-muted-foreground mt-2 ml-6 list-disc space-y-1">
                <li>Name and email address</li>
                <li>Profile information (date of birth, phone number, address, school)</li>
                <li>Aptitude test results and responses</li>
                <li>Learning preferences and style</li>
                <li>Career interests and goals</li>
                <li>Course enrollment and progress data</li>
                <li>Job application information</li>
              </ul>

              <h3 className="text-foreground mt-4 text-xl font-semibold">
                2.2 Automatically Collected Information
              </h3>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                When you use our service, we automatically collect certain information, including:
              </p>
              <ul className="text-muted-foreground mt-2 ml-6 list-disc space-y-1">
                <li>Device information (browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, features used)</li>
                <li>IP address and location data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="text-muted-foreground mt-2 ml-6 list-disc space-y-1">
                <li>Provide, maintain, and improve our services</li>
                <li>Generate personalized career recommendations</li>
                <li>Create and deliver customized course content</li>
                <li>Process and manage your course enrollments</li>
                <li>Connect you with relevant job opportunities</li>
                <li>Send you important updates and notifications</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Detect, prevent, and address technical issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">4. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                We do not sell your personal information. We may share your information only in the
                following circumstances:
              </p>
              <ul className="text-muted-foreground mt-2 ml-6 list-disc space-y-1">
                <li>
                  <strong>Service Providers:</strong> We may share information with third-party
                  service providers who perform services on our behalf (e.g., email delivery,
                  analytics, cloud hosting)
                </li>
                <li>
                  <strong>Employers/Partners:</strong> With your consent, we may share your profile
                  and application information with potential employers and partner organizations
                </li>
                <li>
                  <strong>Legal Requirements:</strong> We may disclose information if required by
                  law or in response to valid legal requests
                </li>
                <li>
                  <strong>Business Transfers:</strong> In the event of a merger, acquisition, or
                  sale of assets, your information may be transferred
                </li>
                <li>
                  <strong>With Your Consent:</strong> We may share information for any other purpose
                  with your explicit consent
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">5. Data Security</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect
                your personal information against unauthorized access, alteration, disclosure, or
                destruction. These measures include:
              </p>
              <ul className="text-muted-foreground mt-2 ml-6 list-disc space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security assessments and updates</li>
                <li>Employee training on data protection</li>
                <li>Secure database storage with industry-standard practices</li>
              </ul>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                However, no method of transmission over the Internet or electronic storage is 100%
                secure. While we strive to use commercially acceptable means to protect your
                information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">6. Your Rights and Choices</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                You have the following rights regarding your personal information:
              </p>
              <ul className="text-muted-foreground mt-2 ml-6 list-disc space-y-1">
                <li>
                  <strong>Access:</strong> Request access to your personal information
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate or incomplete
                  information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal information
                </li>
                <li>
                  <strong>Data Portability:</strong> Request a copy of your data in a portable
                  format
                </li>
                <li>
                  <strong>Opt-Out:</strong> Unsubscribe from marketing communications
                </li>
                <li>
                  <strong>Account Deletion:</strong> Delete your account and associated data
                </li>
              </ul>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                To exercise these rights, please contact us at the email address provided below.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">
                7. Cookies and Tracking Technologies
              </h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our service
                and hold certain information. Cookies are files with a small amount of data that may
                include an anonymous unique identifier. You can instruct your browser to refuse all
                cookies or to indicate when a cookie is being sent. However, if you do not accept
                cookies, you may not be able to use some portions of our service.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">8. Children's Privacy</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Our service is designed for users aged 13 and above. We do not knowingly collect
                personal information from children under 13. If you are a parent or guardian and
                believe your child has provided us with personal information, please contact us
                immediately. If we become aware that we have collected personal information from a
                child under 13, we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">
                9. International Data Transfers
              </h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Your information may be transferred to and maintained on computers located outside
                of your state, province, country, or other governmental jurisdiction where data
                protection laws may differ. By using our service, you consent to the transfer of
                your information to these facilities.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">
                10. Changes to This Privacy Policy
              </h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any
                changes by posting the new Privacy Policy on this page and updating the "Last
                updated" date. You are advised to review this Privacy Policy periodically for any
                changes. Changes to this Privacy Policy are effective when they are posted on this
                page.
              </p>
            </section>

            <section>
              <h2 className="text-foreground text-2xl font-bold">11. Contact Us</h2>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please
                contact us:
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
