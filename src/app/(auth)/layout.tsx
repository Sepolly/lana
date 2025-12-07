import { Mascot } from "@/components/ui/mascot";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-secondary" />
          <div className="absolute bottom-40 right-10 w-48 h-48 rounded-full bg-tertiary" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <Mascot size="xl" mood="waving" animate={false} />
          
          <h1 className="text-4xl font-bold mt-8 text-center">
            Welcome to Lana
          </h1>
          
          <p className="text-xl text-secondary mt-4 text-center max-w-md">
            Your AI-powered career guidance companion. Discover your path to success.
          </p>
          
          <div className="mt-12 space-y-4 text-center">
            <div className="flex items-center gap-3 text-secondary">
              <div className="w-2 h-2 rounded-full bg-tertiary" />
              <span>Personalized aptitude assessment</span>
            </div>
            <div className="flex items-center gap-3 text-secondary">
              <div className="w-2 h-2 rounded-full bg-tertiary" />
              <span>AI-powered career recommendations</span>
            </div>
            <div className="flex items-center gap-3 text-secondary">
              <div className="w-2 h-2 rounded-full bg-tertiary" />
              <span>Industry-recognized certifications</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <Mascot size="lg" mood="happy" animate={false} />
            <h1 className="text-2xl font-bold text-primary mt-4">Lana</h1>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}

