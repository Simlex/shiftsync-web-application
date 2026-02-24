import NextAuth, { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ROUTES } from "@/constants/routes";
import { api, isAxiosError } from "./api-client";

/**
 * NextAuth Configuration for ShiftSync
 * Handles JWT authentication with NestJS backend
 */

const config = {
  secret:
    process.env.NEXTAUTH_SECRET || "your-secret-key-for-shiftsync-production",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const response = await api.auth.login(
            credentials.email as string,
            credentials.password as string,
          );

          const { user, access_token } = response.data;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            timezone: user.timezone,
            skills: user.skills,
            desiredWeeklyHours: user.desiredWeeklyHours,
            token: access_token,
          };
        } catch (error: unknown) {
          const message =
            isAxiosError(error) && error.response?.data
              ? ((error.response.data as { message?: string }).message ??
                error.message)
              : error instanceof Error
                ? error.message
                : "Authentication failed";
          throw new Error(message);
        }
      },
    }),
  ],
  pages: {
    signIn: ROUTES.LOGIN,
    error: ROUTES.LOGIN,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.timezone = user.timezone;
        token.skills = user.skills;
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.role = token.role as string;
        session.user.timezone = token.timezone as string;
        session.user.skills = token.skills as string[];
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const protectedRoutes = [
        // Role-based routes
        ROUTES.ADMIN,
        ROUTES.MANAGER,
        ROUTES.STAFF,
        // Legacy routes (to be removed)
        ROUTES.DASHBOARD,
        ROUTES.SCHEDULE,
        ROUTES.AVAILABILITY,
        ROUTES.SWAPS,
        ROUTES.DROPS,
        ROUTES.REQUESTS,
        ROUTES.STAFF_MANAGEMENT,
        ROUTES.ANALYTICS,
      ];

      const pathname = request.nextUrl.pathname;
      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route),
      );

      if (isProtectedRoute) {
        return !!auth?.user;
      }

      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  debug: true, // Enable debug in production to see what's happening
  trustHost: true,
} satisfies NextAuthConfig;

export const { auth, signIn, signOut, handlers } = NextAuth(config);
