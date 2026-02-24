export const queryKeys = {
  // Users
  Users: (params?: { role?: string; locationId?: string }) =>
    ["users", params] as const,
  User: (id: string) => ["users", id] as const,
  UserProfile: () => ["users", "profile"] as const,

  // Locations
  Locations: () => ["locations"] as const,
  Location: (id: string) => ["locations", id] as const,
  LocationStaff: (id: string) => ["locations", id, "staff"] as const,
  ManagedLocations: () => ["locations", "managed"] as const,

  // Shifts
  Shifts: (params?: {
    locationId?: string;
    startDate?: string;
    endDate?: string;
  }) => ["shifts", params] as const,
  Shift: (id: string) => ["shifts", id] as const,
  MyShifts: (startDate?: string, endDate?: string) =>
    ["shifts", "my", startDate, endDate] as const,

  // Swaps
  Swaps: (params?: { status?: string; userId?: string }) =>
    ["swaps", params] as const,

  // Drops
  Drops: (params?: { status?: string; userId?: string }) =>
    ["drops", params] as const,

  // Availability
  Availability: (userId?: string) => ["availability", userId] as const,
};
