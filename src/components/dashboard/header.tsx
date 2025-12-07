"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from "lucide-react";

interface DashboardHeaderProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2 hover:bg-muted rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          
          <Link href="/dashboard" className="flex items-center">
            <Image 
                src="/lana_logo.jpg" 
                alt="Lana Logo" 
                width={72}
                height={72}
                className="object-contain"
                priority
              />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses, careers..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-muted rounded-lg">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-lg"
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                  {getInitials(user.name)}
                </div>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform hidden sm:block",
                  isProfileOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg animate-fade-in">
                <div className="p-3 border-b border-border">
                  <p className="font-medium text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <div className="p-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </div>
                <div className="p-2 border-t border-border">
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted w-full text-left text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card animate-slide-up">
          <div className="p-4 space-y-4">
            {/* Mobile search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search courses, careers..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Mobile nav links */}
            <nav className="space-y-1">
              <MobileNavLink href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                Dashboard
              </MobileNavLink>
              <MobileNavLink href="/courses" onClick={() => setIsMobileMenuOpen(false)}>
                Courses
              </MobileNavLink>
              <MobileNavLink href="/careers" onClick={() => setIsMobileMenuOpen(false)}>
                Careers
              </MobileNavLink>
              <MobileNavLink href="/certificates" onClick={() => setIsMobileMenuOpen(false)}>
                Certificates
              </MobileNavLink>
              <MobileNavLink href="/jobs" onClick={() => setIsMobileMenuOpen(false)}>
                Jobs
              </MobileNavLink>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 rounded-lg hover:bg-muted text-foreground"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

