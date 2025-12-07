"use client";

import * as React from "react";
import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-x-hidden ml-64">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    );
  }

  return (
    <main 
      className={cn(
        "flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 overflow-x-hidden transition-all duration-300",
        isCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  );
}

