"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Briefcase,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Courses", href: "/admin/courses", icon: BookOpen },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Admins", href: "/admin/admins", icon: Shield },
  { title: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { title: "Companies", href: "/admin/companies", icon: Building2 },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("admin-sidebar-collapsed");
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }
  }, []);

  // Persist to localStorage and dispatch event
  const handleToggle = React.useCallback(() => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem("admin-sidebar-collapsed", String(newValue));
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent("admin-sidebar-toggle", { detail: newValue }));
  }, [isCollapsed]);

  // Handle sign out
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <aside className="bg-primary text-primary-foreground fixed top-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col" />
    );
  }

  const userInitial = userName?.charAt(0) || userEmail?.charAt(0).toUpperCase() || "A";

  return (
    <aside
      className={cn(
        "bg-primary text-primary-foreground fixed top-0 left-0 z-40 flex h-screen shrink-0 flex-col border-r border-white/10 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-2 transition-opacity",
            isCollapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <span className="text-xl font-bold">L</span>
          </div>
          <div>
            <span className="text-lg font-bold">Lana</span>
            <span className="block text-xs text-white/60">Admin Panel</span>
          </div>
        </Link>
        {isCollapsed && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <span className="text-xl font-bold">L</span>
          </div>
        )}
        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          className={cn(
            "shrink-0 rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {adminNavItems.map((item) => {
          // For Dashboard (/admin), only match exactly. For other routes, match exact or sub-routes
          let isActive = false;
          if (item.href === "/admin") {
            // Dashboard should only be active on exactly /admin
            isActive = pathname === "/admin";
          } else {
            // Other routes match exact path or sub-routes
            isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl transition-all duration-200",
                isCollapsed ? "justify-center px-3 py-3" : "px-4 py-3",
                isActive
                  ? "bg-white/20 text-white shadow-md"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-white/10 p-4">
        {!isCollapsed ? (
          <>
            <div className="mb-2 flex items-center gap-3 px-4 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{userName || "Admin"}</p>
                <p className="truncate text-xs text-white/60">{userEmail || "admin@lana.com"}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
              {userInitial}
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
