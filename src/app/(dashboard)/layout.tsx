import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/constants/routes";
import { AuthSessionProvider } from "@/components/layout/session-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { User, UserRole } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  const user: User = {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role as UserRole,
    timezone: session.user.timezone ?? "UTC",
    skills: session.user.skills ?? [],
    createdAt: "",
    updatedAt: "",
  };

  return (
    <AuthSessionProvider session={session} user={user}>
      <DashboardShell>{children}</DashboardShell>
    </AuthSessionProvider>
  );
}
