// --------------------------------------------------------------------------
// Role badge configuration
// --------------------------------------------------------------------------

import { UserRole } from "@/types";

export const ROLE_BADGE_STYLES: Record<
  UserRole,
  { label: string; className: string }
> = {
  ADMIN: {
    label: "Admin",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  MANAGER: {
    label: "Manager",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  STAFF: {
    label: "Staff",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
};
