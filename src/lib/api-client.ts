import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { ROUTES } from "@/constants/routes";
import type {
  RecurringAvailability,
  AvailabilityException,
  CreateUser,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ============================================================================
// Axios Instance Setup
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // Include cookies for JWT auth
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================================
// Token Management
// ============================================================================

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};

// ============================================================================
// Request Interceptor
// ============================================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token is automatically included via defaults if set
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// ============================================================================
// Response Interceptor
// ============================================================================

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        await apiClient.post("/auth/refresh");

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login on refresh failure
        if (typeof window !== "undefined") {
          window.location.href = ROUTES.LOGIN;
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// ============================================================================
// API Methods
// ============================================================================

export const api = {
  // Authentication
  auth: {
    login: (email: string, password: string) =>
      apiClient.post("/auth/login", { email, password }),
    register: (email: string, password: string, name: string) =>
      apiClient.post("/auth/register", { email, password, name }),
    refresh: () => apiClient.post("/auth/refresh"),
    logout: () => apiClient.post("/auth/logout"),
  },

  // Users
  users: {
    getUsers: (params?: { role?: string; locationId?: string }) =>
      apiClient.get("/users", { params }),
    getUser: (id: string) => apiClient.get(`/users/${id}`),
    getProfile: () => apiClient.get("/users/me"),
    updateProfile: (data: {
      name?: string;
      email?: string;
      timezone?: string;
      skills?: string[];
      desiredWeeklyHours?: number;
    }) => apiClient.patch("/users/me/profile", data),
    createUser: (data: CreateUser) => apiClient.post("/users", data),
    updateUser: (
      id: string,
      data: Partial<{
        name: string;
        email: string;
        role: "ADMIN" | "MANAGER" | "STAFF";
        preferredTimezone: string;
        desiredWeeklyHours: number;
      }>,
    ) => apiClient.patch(`/users/${id}`, data),
    deleteUser: (id: string) => apiClient.delete(`/users/${id}`),
    getEligibleStaff: (locationId: string, skill?: string) =>
      apiClient.get(`/users/eligible/${locationId}`, {
        params: skill ? { skill } : undefined,
      }),
    getAvailability: () => apiClient.get("/users/availability"),
    updateAvailability: (data: {
      recurring: RecurringAvailability[];
      exceptions: AvailabilityException[];
    }) => apiClient.put("/users/availability", data),
  },

  // Shifts
  shifts: {
    getShifts: (params: {
      locationId?: string;
      startDate?: string;
      endDate?: string;
      userId?: string;
      published?: string;
    }) => apiClient.get("/shifts", { params }),
    getMyShifts: (params?: { startDate?: string; endDate?: string }) =>
      apiClient.get("/shifts/my-shifts", { params }),
    getShift: (id: string) => apiClient.get(`/shifts/${id}`),
    createShift: (data: {
      locationId: string;
      localDate: string;
      startTime: string;
      endTime: string;
      requiredSkill: string;
      requiredHeadcount: number;
    }) => apiClient.post("/shifts", data),
    updateShift: (
      id: string,
      data: Partial<{
        localDate: string;
        startTime: string;
        endTime: string;
        requiredSkill: string;
        requiredHeadcount: number;
      }>,
    ) => apiClient.patch(`/shifts/${id}`, data),
    deleteShift: (id: string) => apiClient.delete(`/shifts/${id}`),
    getEligibleStaff: (shiftId: string) =>
      apiClient.get(`/shifts/${shiftId}/eligible-staff`),
    assignShift: (
      id: string,
      data: { userId: string; overrideReason?: string },
    ) => apiClient.post(`/shifts/${id}/assign`, data),
    unassignUser: (shiftId: string, userId: string) =>
      apiClient.delete(`/shifts/${shiftId}/assignments/${userId}`),
    publishShift: (shiftId: string) =>
      apiClient.patch(`/shifts/${shiftId}/publish`, {}),
    unpublishShift: (shiftId: string) =>
      apiClient.patch(`/shifts/${shiftId}/unpublish`, {}),
  },

  // Swap Requests
  swaps: {
    getSwaps: (params?: { status?: string; userId?: string }) =>
      apiClient.get("/swaps", { params }),
    getSwap: (id: string) => apiClient.get(`/swaps/${id}`),
    createSwap: (data: {
      fromAssignmentId: string;
      toUserId: string;
      reason?: string;
    }) => apiClient.post("/swaps", data),
    approveSwap: (id: string, reason?: string) =>
      apiClient.put(`/swaps/${id}/approve`, { reason }),
    rejectSwap: (id: string, reason: string) =>
      apiClient.put(`/swaps/${id}/reject`, { reason }),
  },

  // Drop Requests
  drops: {
    getDrops: (params?: { status?: string; userId?: string }) =>
      apiClient.get("/drops", { params }),
    getMyDrops: (params?: { status?: string }) =>
      apiClient.get("/drops/my-drops", { params }),
    getDrop: (id: string) => apiClient.get(`/drops/${id}`),
    createDrop: (data: {
      shiftId: string;
      reason?: string;
      expiresAt?: string;
    }) => apiClient.post("/drops", data),
    claimDrop: (id: string) => apiClient.post(`/drops/${id}/claim`, {}),
    updateDrop: (id: string, data: { reason?: string; expiresAt?: string }) =>
      apiClient.patch(`/drops/${id}`, data),
    extendDrop: (id: string, newExpiry: string) =>
      apiClient.patch(`/drops/${id}`, { expiresAt: newExpiry }),
    cancelDrop: (id: string) => apiClient.delete(`/drops/${id}`),
  },

  // Locations
  locations: {
    getLocations: () => apiClient.get("/locations"),
    getLocation: (id: string) => apiClient.get(`/locations/${id}`),
    getLocationStaff: (id: string) => apiClient.get(`/locations/${id}/staff`),
    getManagedLocations: () => apiClient.get("/locations/my-managed"),
    createLocation: (data: {
      name: string;
      timezone: string;
      address?: string;
    }) => apiClient.post("/locations", data),
    updateLocation: (
      id: string,
      data: Partial<{ name: string; timezone: string; address: string }>,
    ) => apiClient.patch(`/locations/${id}`, data),
    deleteLocation: (id: string) => apiClient.delete(`/locations/${id}`),
    assignManager: (locationId: string, managerId: string) =>
      apiClient.post(`/locations/${locationId}/managers`, {
        managerId,
      }),
    removeManager: (locationId: string, managerId: string) =>
      apiClient.delete(`/locations/${locationId}/managers/${managerId}`),
  },

  // Notifications
  notifications: {
    getNotifications: (params?: { read?: boolean; limit?: number }) =>
      apiClient.get("/notifications", { params }),
    markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.patch("/notifications/mark-all-read"),
    deleteNotification: (id: string) =>
      apiClient.delete(`/notifications/${id}`),
  },

  // Constraints
  constraints: {
    checkAssignment: (userId: string, shiftId: string) =>
      apiClient.post("/constraints/check-assignment", {
        userId,
        shiftId,
      }),
    checkSwap: (initiatorId: string, targetId: string) =>
      apiClient.post("/constraints/check-swap", {
        initiatorId,
        targetId,
      }),
  },
};

export default apiClient;

// ============================================================================
// Error Handling Utilities
// ============================================================================

interface APIErrorResponse {
  message?: string;
  error?: string;
  details?: { field: string; message: string }[];
}

export const isAxiosError = (error: unknown): error is AxiosError => {
  return axios.isAxiosError(error);
};

export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    if (typeof error.response?.data === "object" && error.response?.data) {
      const data = error.response.data as APIErrorResponse;
      return data.message || data.error || error.message || "An error occurred";
    }
    return error.message || "An error occurred";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
};

export const getFieldErrors = (error: unknown): Record<string, string> => {
  if (isAxiosError(error) && error.response?.status === 422) {
    const data = error.response.data as APIErrorResponse;
    if (Array.isArray(data.details)) {
      return data.details.reduce(
        (
          acc: Record<string, string>,
          detail: { field: string; message: string },
        ) => {
          acc[detail.field] = detail.message;
          return acc;
        },
        {},
      );
    }
  }
  return {};
};
