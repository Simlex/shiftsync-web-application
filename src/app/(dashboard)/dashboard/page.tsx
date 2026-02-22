import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/constants/routes";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  const role = session.user.role;

  switch (role) {
    case "ADMIN":
      redirect(ROUTES.DASHBOARD_ADMIN);
    case "MANAGER":
      redirect(ROUTES.DASHBOARD_MANAGER);
    default:
      redirect(ROUTES.DASHBOARD_STAFF);
  }
}
