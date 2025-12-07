"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Users, Briefcase, Building2, Settings, LogOut, ChevronLeft, ChevronRight, Shield } from "lucide-react";
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
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col shrink-0 fixed left-0 top-0 h-screen z-40" />
    );
  }

  const userInitial = userName?.charAt(0) || userEmail?.charAt(0).toUpperCase() || "A";

  return (
    <aside
      className={cn(
        "bg-primary text-primary-foreground flex flex-col shrink-0 fixed left-0 top-0 h-screen z-40 transition-all duration-300 border-r border-white/10",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-2 transition-opacity",
            isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold">L</span>
          </div>
          <div>
            <span className="font-bold text-lg">Lana</span>
            <span className="block text-xs text-white/60">Admin Panel</span>
          </div>
        </Link>
        {isCollapsed && (
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold">L</span>
          </div>
        )}
        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          className={cn(
            "p-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white shrink-0",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
              <item.icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 px-4 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName || "Admin"}</p>
                <p className="text-xs text-white/60 truncate">{userEmail || "admin@lana.com"}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 w-full text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
              {userInitial}
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

