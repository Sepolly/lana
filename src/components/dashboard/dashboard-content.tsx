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
      <main className="ml-64 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 xl:p-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    );
  }

  return (
    <main
      className={cn(
        "flex-1 overflow-x-hidden p-4 transition-all duration-300 sm:p-6 lg:p-8 xl:p-10",
        isCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  );
}
