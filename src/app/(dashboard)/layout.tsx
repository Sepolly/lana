import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardHeader } from "@/components/dashboard/header";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <div className="bg-background min-h-screen">
        <DashboardHeader user={session.user} />
        <div className="flex">
          <DashboardNav />
          <DashboardContent>{children}</DashboardContent>
        </div>
      </div>
    </SidebarProvider>
  );
}
