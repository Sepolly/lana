"use client";

import * as React from "react";

export function AdminContent({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Load from localStorage on mount and listen for changes
  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("admin-sidebar-collapsed");
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }

    // Listen for custom toggle event
    const handleToggle = (e: CustomEvent<boolean>) => {
      setIsCollapsed(e.detail);
    };

    // Listen for storage changes (in case sidebar state changes in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "admin-sidebar-collapsed") {
        setIsCollapsed(e.newValue === "true");
      }
    };

    window.addEventListener("admin-sidebar-toggle", handleToggle as EventListener);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("admin-sidebar-toggle", handleToggle as EventListener);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <main className="ml-20 flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    );
  }

  return (
    <main
      className={`flex-1 overflow-auto transition-all duration-300 ${
        isCollapsed ? "ml-20" : "ml-64"
      }`}
    >
      <div className="p-8">{children}</div>
    </main>
  );
}
