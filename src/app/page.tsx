import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/constants/routes";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect(ROUTES.DASHBOARD);
  }

  redirect(ROUTES.LOGIN);
}
