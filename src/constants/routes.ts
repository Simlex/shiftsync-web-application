export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",

  // Role-based dashboards
  ADMIN: "/admin",
  MANAGER: "/manager",
  STAFF: "/staff",

  // Admin routes
  ADMIN_ANALYTICS: "/admin/analytics",
  ADMIN_STAFF: "/admin/staff",
  ADMIN_SCHEDULE: "/admin/schedule",
  ADMIN_AVAILABILITY: "/admin/availability",
  ADMIN_SWAPS: "/admin/swaps",
  ADMIN_DROPS: "/admin/drops",
  ADMIN_REQUESTS: "/admin/requests",

  // Manager routes
  MANAGER_SCHEDULE: "/manager/schedule",
  MANAGER_REQUESTS: "/manager/requests",
  MANAGER_DROPS: "/manager/drops",
  MANAGER_SWAPS: "/manager/swaps",

  // Staff routes
  STAFF_SCHEDULE: "/staff/schedule",
  STAFF_AVAILABILITY: "/staff/availability",
  STAFF_SWAPS: "/staff/swaps",
  STAFF_DROPS: "/staff/drops",
  STAFF_REQUESTS: "/staff/requests",

  // Legacy routes (to be removed)
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
  STAFF_MANAGEMENT: "/staff",
  ANALYTICS: "/analytics",
  SETTINGS: "/settings",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
