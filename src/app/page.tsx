import Link from "next/link";
import { Button, Mascot } from "@/components/ui";
import { ArrowRight, BookOpen, Award, Briefcase, Brain, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/lana_logo.jpg" alt="Lana Logo" width={64} height={64} />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
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
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                AI-Powered Career Guidance
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Discover Your
                <span className="text-primary block">Perfect Career Path</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto lg:mx-0">
                Take our AI-powered aptitude test to uncover your strengths, 
                get personalized career recommendations, and access courses 
                that lead to real job opportunities.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center lg:justify-start">
                <Link href="/register">
                  <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
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
              <div className="flex items-center gap-8 mt-12 justify-center lg:justify-start">
                <div>
                  <p className="text-3xl font-bold text-primary">10K+</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-3xl font-bold text-primary">50+</p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-3xl font-bold text-primary">95%</p>
                  <p className="text-sm text-muted-foreground">Job Placement</p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <div className="relative">
                {/* Decorative elements */}
                <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-secondary opacity-50" />
                <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-tertiary opacity-50" />
                
                {/* Mascot */}
                <div className="relative z-10 bg-card rounded-3xl p-8 shadow-2xl">
                  <Mascot size="xl" mood="waving" animate={true} />
                  <div className="mt-4 text-center">
                    <p className="font-semibold text-foreground">Hi, I&apos;m Lana!</p>
                    <p className="text-sm text-muted-foreground">Your career guide</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Everything You Need to Succeed
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              From discovering your strengths to landing your dream job, 
              Lana provides a complete career development journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
              title="Aptitude Assessment"
              description="Discover your strengths, learning style, and career inclinations through our AI-powered test."
            />
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Personalized Courses"
              description="Access courses tailored to your learning style with videos, interactive content, and quizzes."
            />
            <FeatureCard
              icon={<Award className="w-6 h-6" />}
              title="Certified Credentials"
              description="Earn blockchain-verified certificates recognized by the Ministry of Education."
            />
            <FeatureCard
              icon={<Briefcase className="w-6 h-6" />}
              title="Job Placement"
              description="Apply for jobs directly on the platform with our partner companies."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              How It Works
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Your journey to a successful career starts with just a few simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-primary rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Find Your Career Path?
              </h2>
              <p className="text-white/80 mt-4 max-w-xl mx-auto">
                Join thousands of students who have discovered their strengths 
                and found meaningful careers through Lana.
              </p>
              <Link href="/register">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="mt-8"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Image src="/lana_logo.jpg" alt="Lana Logo" width={100} height={100} />
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} Lana Career Platform. All rights reserved.
            </p>

            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
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
    <div className="bg-background rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground text-lg">{title}</h3>
      <p className="text-muted-foreground text-sm mt-2">{description}</p>
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
      <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto">
        {number}
      </div>
      <h3 className="font-semibold text-foreground text-xl mt-6">{title}</h3>
      <p className="text-muted-foreground mt-2">{description}</p>
    </div>
  );
}
