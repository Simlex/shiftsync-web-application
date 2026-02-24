import { api, getErrorMessage } from "@/lib/api-client";
import { timezone } from "@/lib/timezone";
import { Shift } from "@/types";
import { EligibleStaffMember } from "@/types/api-models/IStaff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Users,
  Clock,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

type Props = {
  shift: Shift;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userTimezone: string;
};

// Helper function to convert 24-hour time to 12-hour format
const formatTimeTo12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Helper function to suggest available times based on availability patterns
const getSuggestedTimes = (
  staff: EligibleStaffMember,
  shiftDate: string,
): string[] => {
  const suggestions: string[] = [];

  if (staff.violations.some((v) => v.message.includes("availability window"))) {
    // Extract availability window from violation message
    const availabilityMatch = staff.violations[0]?.message.match(
      /availability window (\d{2}:\d{2})-(\d{2}:\d{2})/,
    );
    if (availabilityMatch) {
      const startTime12 = formatTimeTo12Hour(availabilityMatch[1]);
      const endTime12 = formatTimeTo12Hour(availabilityMatch[2]);
      suggestions.push(`Available during: ${startTime12} – ${endTime12}`);
    }

    // Also extract the problematic shift segment for context
    const shiftSegmentMatch = staff.violations[0]?.message.match(
      /Shift segment (\d{2}:\d{2})-(\d{2}:\d{2})/,
    );
    if (shiftSegmentMatch && availabilityMatch) {
      const segmentStart = formatTimeTo12Hour(shiftSegmentMatch[1]);
      const segmentEnd = formatTimeTo12Hour(shiftSegmentMatch[2]);
      suggestions.push(
        `⚠️ Conflicting segment: ${segmentStart} – ${segmentEnd}`,
      );
    }
  } else if (
    staff.warnings.some((w) => w.message.includes("approaching overtime"))
  ) {
    suggestions.push("Consider shorter shift or different day");
  }

  return suggestions;
};

export default function AssignStaffDialog(props: Props) {
  const { shift, open, onOpenChange, userTimezone } = props;

  const queryClient = useQueryClient();

  // Debug: Log shift data when dialog opens
  console.log("🔍 AssignStaffDialog - Shift data:", {
    id: shift.id,
    startTime: shift.startTime,
    endTime: shift.endTime,
    locationTimezone: shift.location?.timezone,
    userTimezone: userTimezone,
  });

  const { data: eligibleStaff, isLoading } = useQuery({
    queryKey: ["shifts", shift.id, "eligible-staff"],
    queryFn: async () => {
      console.log("🔍 Fetching eligible staff for shift:", shift.id);
      const res = await api.shifts.getEligibleStaff(shift.id);
      console.log("🔍 Eligible staff response:", res.data);
      return res.data as EligibleStaffMember[];
    },
    enabled: open,
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string) =>
      api.shifts.assignShift(shift.id, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Staff assigned successfully");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const shiftTimeLabel = `${timezone.formatUserTime(shift.startTime, userTimezone, "h:mm a")} – ${timezone.formatUserTime(shift.endTime, userTimezone, "h:mm a")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Staff</DialogTitle>
          <DialogDescription>
            {shift.location?.name ?? "Unknown"} · {shiftTimeLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !eligibleStaff || eligibleStaff.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Users className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm font-medium">No eligible staff</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                No staff members match the required skill and location.
              </p>
            </div>
          ) : (
            eligibleStaff.map((staff) => {
              const suggestedTimes = getSuggestedTimes(staff, shift.startTime);

              return (
                <div
                  key={staff.id}
                  className={cn(
                    "rounded-lg border p-3 space-y-3",
                    staff.canAssign
                      ? "border-zinc-200 dark:border-zinc-800"
                      : "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        size="sm"
                        fallback={staff.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      />
                      <div>
                        <p className="text-sm font-medium">{staff.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {staff.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {staff.canAssign && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <Button
                        size="sm"
                        variant={staff.canAssign ? "default" : "outline"}
                        disabled={assignMutation.isPending}
                        onClick={() => assignMutation.mutate(staff.id)}
                      >
                        {assignMutation.isPending &&
                        assignMutation.variables === staff.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Assign"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Warnings and Violations */}
                  {staff.warnings.length > 0 && (
                    <div className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="size-3 min-w-3 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          Warning: {staff.warnings[0].message}
                        </p>
                        {suggestedTimes.length > 0 && (
                          <p className="mt-1 text-amber-700 dark:text-amber-300">
                            💡 {suggestedTimes[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {!staff.canAssign && staff.violations.length > 0 && (
                    <div className="flex items-start gap-2 text-[11px] text-red-600 dark:text-red-400">
                      <AlertTriangle className="size-3 min-w-3 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          Cannot assign: {staff.violations[0].message}
                        </p>
                        {suggestedTimes.length > 0 && (
                          <div className="mt-1 text-blue-600 dark:text-blue-400">
                            <p className="font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Suggested times:
                            </p>
                            <p>{suggestedTimes[0]}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Staff availability info for assignable staff */}
                  {staff.canAssign && (
                    <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Available for this shift</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Score: {staff.score}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" className="text-xs">
            <Clock className="mr-1 h-3 w-3" />
            Adjust Shift Time
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
