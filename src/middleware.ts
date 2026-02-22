export { auth as middleware } from "@/lib/auth";

// NOTE: Matcher strings must be static string literals for Next.js static analysis.
// Keep these in sync with ROUTES from "@/constants/routes".
export const config = {
  matcher: [
    // Role-based route protection
    "/admin/:path*",
    "/manager/:path*",
    "/staff/:path*",
    // Legacy routes (to be removed)
    "/dashboard/:path*",
    "/schedule/:path*",
    "/availability/:path*",
    "/swaps/:path*",
    "/drops/:path*",
    "/requests/:path*",
    "/analytics/:path*",
  ],
};
