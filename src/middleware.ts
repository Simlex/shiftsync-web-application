export { auth as middleware } from "@/lib/auth";

// NOTE: Matcher strings must be static string literals for Next.js static analysis.
// Keep these in sync with ROUTES from "@/constants/routes".
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/schedule/:path*",
    "/availability/:path*",
    "/swaps/:path*",
    "/drops/:path*",
    "/requests/:path*",
    "/staff/:path*",
    "/analytics/:path*",
  ],
};
