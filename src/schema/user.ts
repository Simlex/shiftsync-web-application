import z from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["STAFF", "MANAGER", "ADMIN"] as const).optional(),
  preferredTimezone: z.string().optional(),
  desiredWeeklyHours: z.number().min(0).max(80).optional(),
  skills: z.array(z.string()).max(5, "Maximum 5 skills allowed").optional(),
});
