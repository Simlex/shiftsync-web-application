import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/constants/routes";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    // Redirect based on user role
    switch (session.user.role) {
      case "ADMIN":
        redirect(ROUTES.ADMIN);
        break;
      case "MANAGER":
        redirect(ROUTES.MANAGER);
        break;
      case "STAFF":
        redirect(ROUTES.STAFF);
        break;
      default:
        redirect(ROUTES.STAFF); // Default to staff if role is unknown
    }
  }

  redirect(ROUTES.LOGIN);
}
