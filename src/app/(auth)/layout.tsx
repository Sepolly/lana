import { Mascot } from "@/components/ui/mascot";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen">
      {/* Left side - Branding */}
      <div className="bg-primary relative hidden overflow-hidden lg:flex lg:w-1/2">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="bg-secondary absolute top-20 left-20 h-64 w-64 rounded-full" />
          <div className="bg-tertiary absolute right-10 bottom-40 h-48 w-48 rounded-full" />
          <div className="absolute top-1/2 left-1/3 h-32 w-32 rounded-full bg-white" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex w-full flex-col items-center justify-center p-12 text-white">
          <Mascot size="xl" mood="waving" animate={false} />

          <h1 className="mt-8 text-center text-4xl font-bold">Welcome to Lana</h1>

          <p className="text-secondary mt-4 max-w-md text-center text-xl">
            Your AI-powered career guidance companion. Discover your path to success.
          </p>

          <div className="mt-12 space-y-4 text-center">
            <div className="text-secondary flex items-center gap-3">
              <div className="bg-tertiary h-2 w-2 rounded-full" />
              <span>Personalized aptitude assessment</span>
            </div>
            <div className="text-secondary flex items-center gap-3">
              <div className="bg-tertiary h-2 w-2 rounded-full" />
              <span>AI-powered career recommendations</span>
            </div>
            <div className="text-secondary flex items-center gap-3">
              <div className="bg-tertiary h-2 w-2 rounded-full" />
              <span>Industry-recognized certifications</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <Mascot size="lg" mood="happy" animate={false} />
            <h1 className="text-primary mt-4 text-2xl font-bold">Lana</h1>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
