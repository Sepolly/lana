"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  Award,
  Briefcase,
  Brain,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Recommendations",
    href: "/recommendations",
    icon: Compass,
  },
  {
    title: "My Courses",
    href: "/courses",
    icon: BookOpen,
  },
  {
    title: "Explore Careers",
    href: "/careers",
    icon: Brain,
  },
  {
    title: "Certificates",
    href: "/certificates",
    icon: Award,
  },
  {
    title: "Job Opportunities",
    href: "/jobs",
    icon: Briefcase,
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebar();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <aside className="border-border bg-card fixed top-16 left-0 z-30 hidden h-[calc(100vh-4rem)] w-64 border-r lg:flex" />
    );
  }

  return (
    <aside
      className={cn(
        "border-border bg-card fixed top-16 left-0 z-30 hidden h-[calc(100vh-4rem)] flex-col border-r transition-all duration-300 lg:flex",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <div className="flex justify-end p-2">
        <button
          onClick={toggle}
          className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                isCollapsed ? "justify-center px-3 py-3" : "px-4 py-3",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Help section */}
      <div className={cn("border-border border-t p-2", isCollapsed && "flex justify-center")}>
        {isCollapsed ? (
          <Link
            href="/support"
            title="Contact Support"
            className="bg-secondary/50 hover:bg-secondary flex items-center justify-center rounded-xl p-3 transition-colors"
          >
            <HelpCircle className="text-primary h-5 w-5" />
          </Link>
        ) : (
          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <HelpCircle className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">Need Help?</p>
                <p className="text-muted-foreground text-xs">Get assistance anytime</p>
              </div>
            </div>
            <Link
              href="/support"
              className="bg-primary text-primary-foreground hover:bg-primary/90 block rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors"
            >
              Contact Support
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
