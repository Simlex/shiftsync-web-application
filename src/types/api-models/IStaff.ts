export type EligibleStaffMember = {
  id: string;
  name: string;
  email: string;
  skills: string[];
  preferredTimezone: string;
  desiredWeeklyHours?: number;
  canAssign: boolean;
  violations: { message: string; type: string }[];
  warnings: { message: string; type: string }[];
  score: number;
};
