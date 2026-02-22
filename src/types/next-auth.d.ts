import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    timezone: string;
    skills: string[];
    desiredWeeklyHours?: number;
    token: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      timezone: string;
      skills: string[];
    } & DefaultSession["user"];
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    timezone: string;
    skills: string[];
    accessToken: string;
  }
}
