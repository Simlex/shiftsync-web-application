/**
 * ShiftSync Core Type Definitions
 */

// ============================================================================
// Authentication & Users
// ============================================================================

export type UserRole = "ADMIN" | "MANAGER" | "STAFF";

export type RoleFilter = "ALL" | UserRole;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  preferredTimezone: string; // e.g., "America/New_York"
  skills: string[];
  desiredWeeklyHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUser {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  preferredTimezone?: string;
  skills?: string[];
  desiredWeeklyHours?: number;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

// ============================================================================
// Locations
// ============================================================================

export interface Location {
  id: string;
  name: string;
  timezone: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  managers: {
    id: string;
  }[];
  _count: {
    certifications: number;
    shifts: number;
  };
}

// ============================================================================
// Shifts
// ============================================================================

export type ShiftStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PAST"
  | "UNDERSTAFFED";

export interface Shift {
  id: string;
  locationId: string;
  location?: Location;
  isPublished: boolean;
  publishedAt?: string; // ISO 8601 UTC
  startTime: string; // ISO 8601 UTC
  endTime: string; // ISO 8601 UTC
  requiredSkill: string;
  requiredHeadcount: number;
  status?: ShiftStatus; // Calculated by backend
  assignments?: ShiftAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface ShiftAssignment {
  id: string;
  shiftId: string;
  shift: Shift;
  userId: string;
  user?: User;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  clockInTime?: string; // ISO 8601 UTC
  clockOutTime?: string; // ISO 8601 UTC
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Swap Requests
// ============================================================================

export type SwapRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

export interface SwapRequest {
  id: string;
  fromAssignmentId: string;
  fromAssignment?: ShiftAssignment;
  toUserId: string;
  toUser?: User;
  requestedById: string;
  requestedBy?: User;
  status: SwapRequestStatus;
  managerApproved: boolean;
  shiftId?: string;
  shift?: Shift;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Drop Requests
// ============================================================================

export type DropRequestStatus = "OPEN" | "CLAIMED" | "EXPIRED" | "CANCELLED";

export interface DropRequest {
  id: string;
  userId: string;
  user?: User;
  shiftId: string;
  shift?: ShiftAssignment;
  status: DropRequestStatus;
  expiresAt: string; // ISO 8601 UTC
  claimedBy?: Pick<User, "email" | "id" | "name">; // userId
  claimedAt?: string; // ISO 8601 UTC
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Availability
// ============================================================================

export interface RecurringAvailability {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
}

export interface AvailabilityException {
  date: string; // "2026-03-15"
  unavailable?: boolean;
  customHours?: {
    startTime: string;
    endTime: string;
  };
}

export interface UserAvailability {
  userId: string;
  recurring: RecurringAvailability[];
  exceptions: AvailabilityException[];
  updatedAt: string;
}

// ============================================================================
// Notifications
// ============================================================================

export type NotificationType =
  | "SHIFT_ASSIGNED"
  | "SWAP_REQUESTED"
  | "SWAP_APPROVED"
  | "SWAP_REJECTED"
  | "DROP_CLAIMED"
  | "SCHEDULE_PUBLISHED"
  | "OVERTIME_WARNING"
  | "AVAILABILITY_UPDATED";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// ============================================================================
// Constraints
// ============================================================================

export type ConstraintSeverity = "HARD" | "SOFT";

export interface ConstraintViolation {
  type: ConstraintSeverity;
  rule: string;
  message: string;
  severity: "ERROR" | "WARNING";
}

export interface ConstraintCheckResult {
  valid: boolean;
  violations: ConstraintViolation[];
  suggestions?: string[];
}

// ============================================================================
// API Responses
// ============================================================================

export interface APIError {
  statusCode: number;
  message: string;
  error?: string;
  details?: { field: string; message: string; [key: string]: unknown }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// UI Types
// ============================================================================

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ============================================================================
// Socket Events
// ============================================================================

export interface SocketEventMap {
  // Server -> Client
  "shift-assigned": (assignment: ShiftAssignment) => void;
  "shift-updated": (shift: Shift) => void;
  "swap-requested": (request: SwapRequest) => void;
  "swap-approved": (request: SwapRequest) => void;
  "swap-rejected": (request: SwapRequest) => void;
  "drop-claimed": (request: DropRequest) => void;
  "schedule-published": (locationId: string) => void;
  "overtime-warning": (userId: string, hours: number) => void;

  // Client -> Server
  "join-location": (locationId: string) => void;
  "leave-location": (locationId: string) => void;
}
