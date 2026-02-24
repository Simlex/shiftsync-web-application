"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (session?.user) {
      // Redirect based on user role
      switch (session.user.role) {
        case "ADMIN":
          router.replace(ROUTES.ADMIN);
          break;
        case "MANAGER":
          router.replace(ROUTES.MANAGER);
          break;
        case "STAFF":
          router.replace(ROUTES.STAFF);
          break;
        default:
          router.replace(ROUTES.STAFF); // Default to staff if role is unknown
      }
    } else {
      // No session, redirect to login
      router.replace(ROUTES.LOGIN);
    }
  }, [session, status, router]);

  // Show loading spinner while determining authentication state
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
