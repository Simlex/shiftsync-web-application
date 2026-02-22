/**
 * Application Constants
 */

// API Configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

// Roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
} as const;

// Shift Status
export const SHIFT_STATUS = {
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

// Swap Request Status
export const SWAP_REQUEST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

// Drop Request Status
export const DROP_REQUEST_STATUS = {
  OPEN: "OPEN",
  CLAIMED: "CLAIMED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  SHIFT_ASSIGNED: "SHIFT_ASSIGNED",
  SWAP_REQUESTED: "SWAP_REQUESTED",
  SWAP_APPROVED: "SWAP_APPROVED",
  SWAP_REJECTED: "SWAP_REJECTED",
  DROP_CLAIMED: "DROP_CLAIMED",
  SCHEDULE_PUBLISHED: "SCHEDULE_PUBLISHED",
  OVERTIME_WARNING: "OVERTIME_WARNING",
  AVAILABILITY_UPDATED: "AVAILABILITY_UPDATED",
} as const;

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
} as const;

// Date Formats
export const DATE_FORMATS = {
  DATE_ONLY: "yyyy-MM-dd",
  TIME_ONLY: "HH:mm",
  DATETIME: "yyyy-MM-dd HH:mm",
  DATETIME_SECONDS: "yyyy-MM-dd HH:mm:ss",
  DISPLAY_DATE: "MMM d, yyyy",
  DISPLAY_DATETIME: "MMM d, yyyy HH:mm",
  WEEK_DAY_DATE: "EEEE, MMM d",
} as const;

// UI Configuration
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 256, // 64rem in px at default scale
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  DIALOG_ANIMATION_DURATION: 200,
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Common Validation Rules
export const VALIDATION_RULES = {
  EMAIL_REGEX:
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Days of Week
export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAYS_OF_WEEK_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export { ROUTES, type AppRoute } from "./routes";
