import type { ShiftStatus } from "@/types";

export function getShiftStatusVariant(
  status: ShiftStatus,
): "default" | "success" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "SCHEDULED":
      return "default";
    case "IN_PROGRESS":
      return "secondary";
    case "COMPLETED":
      return "success";
    case "DRAFT":
      return "outline";
    case "UNDERSTAFFED":
      return "destructive";
    case "PAST":
      return "secondary";
    default:
      return "outline";
  }
}

export function getShiftStatusLabel(status: ShiftStatus): string {
  return status.replace("_", " ");
}
