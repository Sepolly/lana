import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminContent } from "@/components/admin/admin-content";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Admin role check disabled for now (as per requirements)
  // TODO: Re-enable admin role check when implementing admin authentication
  // const user = await db.user.findUnique({
  //   where: { id: session.user.id },
  //   select: { role: true },
  // });
  //
  // if (user?.role !== "ADMIN") {
  //   redirect("/dashboard");
  // }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar userName={session.user.name} userEmail={session.user.email} />
      <AdminContent>{children}</AdminContent>
    </div>
  );
}
