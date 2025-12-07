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
      <aside className="hidden lg:flex w-64 fixed left-0 top-16 h-[calc(100vh-4rem)] border-r border-border bg-card z-30" />
    );
  }

  return (
    <aside 
      className={cn(
        "hidden lg:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] border-r border-border bg-card z-30 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <div className="p-2 flex justify-end">
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

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
      <div className={cn("p-2 border-t border-border", isCollapsed && "flex justify-center")}>
        {isCollapsed ? (
          <Link
            href="/support"
            title="Contact Support"
            className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors flex items-center justify-center"
          >
            <HelpCircle className="h-5 w-5 text-primary" />
          </Link>
        ) : (
          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Need Help?</p>
                <p className="text-xs text-muted-foreground">
                  Get assistance anytime
                </p>
              </div>
            </div>
            <Link
              href="/support"
              className="block text-center py-2 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
