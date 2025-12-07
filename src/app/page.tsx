import Link from "next/link";
import { Button, Mascot } from "@/components/ui";
import { ArrowRight, BookOpen, Award, Briefcase, Brain, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card/80 border-border fixed top-0 z-50 w-full border-b backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/lana_logo.jpg" alt="Lana Logo" width={64} height={64} />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 pt-32 pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-12 lg:flex-row">
            <div className="flex-1 text-center lg:text-left">
              <div className="bg-secondary text-secondary-foreground mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
                <span className="bg-primary h-2 w-2 animate-pulse rounded-full" />
                AI-Powered Career Guidance
              </div>

              <h1 className="text-foreground text-4xl leading-tight font-bold md:text-5xl lg:text-6xl">
                Discover Your
                <span className="text-primary block">Perfect Career Path</span>
              </h1>

              <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg lg:mx-0">
                Take our AI-powered aptitude test to uncover your strengths, get personalized career
                recommendations, and access courses that lead to real job opportunities.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <Link href="/register">
                  <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                    Start Your Journey
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 flex items-center justify-center gap-8 lg:justify-start">
                <div>
                  <p className="text-primary text-3xl font-bold">10K+</p>
                  <p className="text-muted-foreground text-sm">Students</p>
                </div>
                <div className="bg-border h-12 w-px" />
                <div>
                  <p className="text-primary text-3xl font-bold">50+</p>
                  <p className="text-muted-foreground text-sm">Courses</p>
                </div>
                <div className="bg-border h-12 w-px" />
                <div>
                  <p className="text-primary text-3xl font-bold">95%</p>
                  <p className="text-muted-foreground text-sm">Job Placement</p>
                </div>
              </div>
            </div>

            <div className="flex flex-1 justify-center">
              <div className="relative">
                {/* Decorative elements */}
                <div className="bg-secondary absolute -top-8 -left-8 h-32 w-32 rounded-full opacity-50" />
                <div className="bg-tertiary absolute -right-8 -bottom-8 h-24 w-24 rounded-full opacity-50" />

                {/* Mascot */}
                <div className="bg-card relative z-10 rounded-3xl p-8 shadow-2xl">
                  <Mascot size="xl" mood="waving" animate={true} />
                  <div className="mt-4 text-center">
                    <p className="text-foreground font-semibold">Hi, I&apos;m Lana!</p>
                    <p className="text-muted-foreground text-sm">Your career guide</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-card px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-foreground text-3xl font-bold md:text-4xl">
              Everything You Need to Succeed
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl">
              From discovering your strengths to landing your dream job, Lana provides a complete
              career development journey.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="Aptitude Assessment"
              description="Discover your strengths, learning style, and career inclinations through our AI-powered test."
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Personalized Courses"
              description="Access courses tailored to your learning style with videos, interactive content, and quizzes."
            />
            <FeatureCard
              icon={<Award className="h-6 w-6" />}
              title="Certified Credentials"
              description="Earn blockchain-verified certificates recognized by the Ministry of Education."
            />
            <FeatureCard
              icon={<Briefcase className="h-6 w-6" />}
              title="Job Placement"
              description="Apply for jobs directly on the platform with our partner companies."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-foreground text-3xl font-bold md:text-4xl">How It Works</h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl">
              Your journey to a successful career starts with just a few simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <StepCard
              number={1}
              title="Take the Aptitude Test"
              description="Answer questions about your interests, skills, and goals to help us understand your unique profile."
            />
            <StepCard
              number={2}
              title="Get Personalized Recommendations"
              description="Our AI analyzes your results and suggests career paths and courses aligned with job market demands."
            />
            <StepCard
              number={3}
              title="Learn & Get Certified"
              description="Complete courses, earn certificates, and apply for jobs directly through our platform."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-primary relative overflow-hidden rounded-3xl p-8 text-center text-white md:p-12">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
            <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/10" />

            <div className="relative z-10">
              <h2 className="text-3xl font-bold md:text-4xl">Ready to Find Your Career Path?</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/80">
                Join thousands of students who have discovered their strengths and found meaningful
                careers through Lana.
              </p>
              <Link href="/register">
                <Button
                  variant="secondary"
                  size="lg"
                  className="mt-8"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-border border-t px-4 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/lana_logo.jpg" alt="Lana Logo" width={100} height={100} />
            </div>

            <p className="text-muted-foreground text-center text-sm">
              © {new Date().getFullYear()} Lana Career Platform. All rights reserved.
            </p>

            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-muted-foreground hover:text-foreground text-sm">
                Terms
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm">
                Privacy
              </Link>
              <Link
                href="mailto:sepolly6@gmail.com"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-background border-border rounded-2xl border p-6 transition-shadow hover:shadow-lg">
      <div className="bg-secondary text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
        {icon}
      </div>
      <h3 className="text-foreground text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="bg-primary mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white">
        {number}
      </div>
      <h3 className="text-foreground mt-6 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2">{description}</p>
    </div>
  );
}
