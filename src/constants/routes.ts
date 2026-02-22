export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  DASHBOARD_STAFF: "/dashboard/staff",
  DASHBOARD_MANAGER: "/dashboard/manager",
  DASHBOARD_ADMIN: "/dashboard/admin",
  SCHEDULE: "/schedule",
  SCHEDULE_MANAGE: "/schedule/manage",
  AVAILABILITY: "/availability",
  SWAPS: "/swaps",
  DROPS: "/drops",
  REQUESTS: "/requests",
  STAFF: "/staff",
  ANALYTICS: "/analytics",
  SETTINGS: "/settings",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
