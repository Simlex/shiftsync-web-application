import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { ROUTES } from "@/constants/routes";
import type { RecurringAvailability, AvailabilityException } from "@/types";

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
    getProfile: () => apiClient.get("/users/profile"),
    updateProfile: (data: {
      name?: string;
      email?: string;
      timezone?: string;
      skills?: string[];
      desiredWeeklyHours?: number;
    }) => apiClient.put("/users/profile", data),
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
    }) => apiClient.get("/shifts", { params }),
    getShift: (id: string) => apiClient.get(`/shifts/${id}`),
    createShift: (data: {
      locationId: string;
      startTime: string;
      endTime: string;
      requiredSkills?: string[];
      headcount: number;
      description?: string;
    }) => apiClient.post("/shifts", data),
    updateShift: (
      id: string,
      data: Partial<{
        locationId: string;
        startTime: string;
        endTime: string;
        requiredSkills: string[];
        headcount: number;
        description: string;
      }>,
    ) => apiClient.put(`/shifts/${id}`, data),
    deleteShift: (id: string) => apiClient.delete(`/shifts/${id}`),
    assignShift: (id: string, userId: string) =>
      apiClient.post(`/shifts/${id}/assign`, { userId }),
    unassignShift: (id: string, assignmentId: string) =>
      apiClient.delete(`/shifts/${id}/unassign`, {
        data: { assignmentId },
      }),
  },

  // Swap Requests
  swaps: {
    getSwaps: (params?: { status?: string; userId?: string }) =>
      apiClient.get("/swaps", { params }),
    getSwap: (id: string) => apiClient.get(`/swaps/${id}`),
    createSwap: (data: {
      initiatorShiftId: string;
      targetUserId: string;
      targetShiftId: string;
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
    getDrop: (id: string) => apiClient.get(`/drops/${id}`),
    createDrop: (data: {
      shiftId: string;
      reason?: string;
      expiresAt?: string;
    }) => apiClient.post("/drops", data),
    claimDrop: (id: string) => apiClient.post(`/drops/${id}/claim`, {}),
    extendDrop: (id: string, newExpiry: string) =>
      apiClient.put(`/drops/${id}/extend`, { expiresAt: newExpiry }),
  },

  // Locations
  locations: {
    getLocations: () => apiClient.get("/locations"),
    getLocation: (id: string) => apiClient.get(`/locations/${id}`),
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
