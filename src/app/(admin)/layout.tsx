import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminContent } from "@/components/admin/admin-content";
import db from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  
  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="bg-background flex min-h-screen">
      <AdminSidebar userName={session.user.name} userEmail={session.user.email} />
      <AdminContent>{children}</AdminContent>
    </div>
  );
}
