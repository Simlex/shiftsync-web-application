"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Users,
  Clock,
  X,
  Wrench,
  Plus,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";
import { api, getErrorMessage } from "@/lib/api-client";
import { timezone } from "@/lib/timezone";
import { useAuth } from "@/contexts/auth-context";
import { DATE_FORMATS } from "@/constants";
import { cn, extractData } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFetchLocations } from "@/hooks/locations";
import type { Shift, Location } from "@/types";

type ViewMode = "week" | "month";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am - 10pm

const LOCATION_COLORS = [
  "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300",
  "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300",
  "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-950 dark:border-purple-700 dark:text-purple-300",
  "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300",
  "bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-300",
  "bg-cyan-100 border-cyan-300 text-cyan-800 dark:bg-cyan-950 dark:border-cyan-700 dark:text-cyan-300",
];

function getLocationColor(locationId: string, locationIds: string[]): string {
  const index = locationIds.indexOf(locationId);
  return LOCATION_COLORS[index % LOCATION_COLORS.length];
}

// --------------------------------------------------------------------------
// Eligible staff type from GET /shifts/:id/eligible-staff
// --------------------------------------------------------------------------

interface EligibleStaffMember {
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
}

// --------------------------------------------------------------------------
// Create Shift Dialog
// --------------------------------------------------------------------------

function CreateShiftDialog({
  open,
  onOpenChange,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
}) {
  const queryClient = useQueryClient();
  const { data: locations = [] } = useFetchLocations();

  const [locationId, setLocationId] = useState("");
  const [localDate, setLocalDate] = useState(
    defaultDate ?? DateTime.now().toFormat(DATE_FORMATS.DATE_ONLY),
  );
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [requiredSkill, setRequiredSkill] = useState("");
  const [requiredHeadcount, setRequiredHeadcount] = useState(1);

  const mutation = useMutation({
    mutationFn: () =>
      api.shifts.createShift({
        locationId,
        localDate,
        startTime,
        endTime,
        requiredSkill,
        requiredHeadcount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Shift created successfully");
      onOpenChange(false);
      // Reset form
      setLocationId("");
      setStartTime("09:00");
      setEndTime("17:00");
      setRequiredSkill("");
      setRequiredHeadcount(1);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const canSubmit =
    locationId && localDate && startTime && endTime && requiredSkill;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Shift</DialogTitle>
          <DialogDescription>
            Add a new shift to the schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Location */}
          <div className="space-y-1.5">
            <Label>Location</Label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">Select location...</option>
              {locations.map((loc: Location) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
            />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Required Skill */}
          <div className="space-y-1.5">
            <Label>Required Skill</Label>
            <Input
              placeholder="e.g. Barista, Cashier..."
              value={requiredSkill}
              onChange={(e) => setRequiredSkill(e.target.value)}
            />
          </div>

          {/* Headcount */}
          <div className="space-y-1.5">
            <Label>Required Headcount</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={requiredHeadcount}
              onChange={(e) =>
                setRequiredHeadcount(parseInt(e.target.value) || 1)
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending ? "Creating..." : "Create Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --------------------------------------------------------------------------
// Assign Staff Dialog
// --------------------------------------------------------------------------

function AssignStaffDialog({
  shift,
  open,
  onOpenChange,
  userTimezone,
}: {
  shift: Shift;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userTimezone: string;
}) {
  const queryClient = useQueryClient();

  const { data: eligibleStaff, isLoading } = useQuery({
    queryKey: ["shifts", shift.id, "eligible-staff"],
    queryFn: async () => {
      const res = await api.shifts.getEligibleStaff(shift.id);
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
            eligibleStaff.map((staff) => (
              <div
                key={staff.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3",
                  staff.canAssign
                    ? "border-zinc-200 dark:border-zinc-800"
                    : "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20",
                )}
              >
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
                    {staff.warnings.length > 0 && (
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-3 min-w-3" />
                        {staff.warnings[0].message}
                      </div>
                    )}
                    {!staff.canAssign && staff.violations.length > 0 && (
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400">
                        <AlertTriangle className="size-3 min-w-3" />
                        {staff.violations[0].message}
                      </div>
                    )}
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
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --------------------------------------------------------------------------
// Edit Shift Dialog
// --------------------------------------------------------------------------

function EditShiftDialog({
  shift,
  open,
  onOpenChange,
  userTimezone,
}: {
  shift: Shift;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userTimezone: string;
}) {
  const queryClient = useQueryClient();

  const shiftStart = timezone.toUserTime(shift.startTime, userTimezone);
  const shiftEnd = timezone.toUserTime(shift.endTime, userTimezone);

  const [localDate, setLocalDate] = useState(
    shiftStart.toFormat(DATE_FORMATS.DATE_ONLY),
  );
  const [startTime, setStartTime] = useState(
    shiftStart.toFormat(DATE_FORMATS.TIME_ONLY),
  );
  const [endTime, setEndTime] = useState(
    shiftEnd.toFormat(DATE_FORMATS.TIME_ONLY),
  );
  const [requiredSkill, setRequiredSkill] = useState(shift.requiredSkill);
  const [requiredHeadcount, setRequiredHeadcount] = useState(
    shift.requiredHeadcount,
  );

  const updateMutation = useMutation({
    mutationFn: () =>
      api.shifts.updateShift(shift.id, {
        localDate,
        startTime,
        endTime,
        requiredSkill,
        requiredHeadcount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Shift updated successfully");
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.shifts.deleteShift(shift.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Shift deleted");
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const isPending = updateMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Shift</DialogTitle>
          <DialogDescription>
            {shift.location?.name ?? "Unknown Location"} ·{" "}
            {shiftStart.toFormat(DATE_FORMATS.WEEK_DAY_DATE)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Required Skill */}
          <div className="space-y-1.5">
            <Label>Required Skill</Label>
            <Input
              value={requiredSkill}
              onChange={(e) => setRequiredSkill(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Headcount */}
          <div className="space-y-1.5">
            <Label>Required Headcount</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={requiredHeadcount}
              onChange={(e) =>
                setRequiredHeadcount(parseInt(e.target.value) || 1)
              }
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteMutation.mutate()}
            disabled={isPending}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --------------------------------------------------------------------------
// Page
// --------------------------------------------------------------------------

export default function SchedulePage() {
  const { user } = useAuth();
  const userTimezone = user?.preferredTimezone ?? "UTC";

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [createShiftOpen, setCreateShiftOpen] = useState(false);
  const [assignStaffOpen, setAssignStaffOpen] = useState(false);
  const [editShiftOpen, setEditShiftOpen] = useState(false);

  const weekStart = useMemo(
    () =>
      DateTime.now()
        .setZone(userTimezone)
        .startOf("week")
        .plus({ weeks: weekOffset }),
    [userTimezone, weekOffset],
  );

  const weekEnd = useMemo(() => weekStart.endOf("week"), [weekStart]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i })),
    [weekStart],
  );

  const weekStartISO = weekStart.toUTC().toISO() ?? "";
  const weekEndISO = weekEnd.toUTC().toISO() ?? "";

  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ["shifts", weekStartISO, weekEndISO],
    queryFn: async () => {
      const res = await api.shifts.getShifts({
        startDate: weekStartISO,
        endDate: weekEndISO,
      });
      return res.data as { data: Shift[] } | Shift[];
    },
    enabled: !!weekStartISO && !!weekEndISO,
    retry: false,
  });

  const shifts = extractData(shiftsData);

  const locationIds = useMemo(() => {
    const ids = new Set<string>();
    shifts.forEach((s) => ids.add(s.locationId));
    return Array.from(ids);
  }, [shifts]);

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>();
    weekDays.forEach((day) => {
      map.set(day.toFormat("yyyy-MM-dd"), []);
    });
    shifts.forEach((shift) => {
      const shiftDay = timezone
        .toUserTime(shift.startTime, userTimezone)
        .toFormat("yyyy-MM-dd");
      const existing = map.get(shiftDay);
      if (existing) {
        existing.push(shift);
      }
    });
    return map;
  }, [shifts, weekDays, userTimezone]);

  const goToToday = () => setWeekOffset(0);
  const goToPrevWeek = () => setWeekOffset((prev) => prev - 1);
  const goToNextWeek = () => setWeekOffset((prev) => prev + 1);

  const isToday = (day: DateTime) =>
    day.hasSame(DateTime.now().setZone(userTimezone), "day");

  const getShiftPosition = (shift: Shift) => {
    const start = timezone.toUserTime(shift.startTime, userTimezone);
    const end = timezone.toUserTime(shift.endTime, userTimezone);
    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;
    const gridStart = 6 * 60; // 6am
    const gridEnd = 22 * 60; // 10pm
    const totalMinutes = gridEnd - gridStart;

    const top = Math.max(0, ((startMinutes - gridStart) / totalMinutes) * 100);
    const height = Math.max(
      2,
      ((Math.min(endMinutes, gridEnd) - Math.max(startMinutes, gridStart)) /
        totalMinutes) *
        100,
    );

    return { top: `${top}%`, height: `${height}%` };
  };

  const formatShiftTime = (shift: Shift) => {
    const start = timezone.formatUserTime(
      shift.startTime,
      userTimezone,
      "h:mm a",
    );
    const end = timezone.formatUserTime(shift.endTime, userTimezone, "h:mm a");
    return `${start} – ${end}`;
  };

  const getShiftDuration = (shift: Shift) => {
    const start = timezone.toUserTime(shift.startTime, userTimezone);
    const end = timezone.toUserTime(shift.endTime, userTimezone);
    return timezone.formatDuration(timezone.getDurationMinutes(start, end));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            {weekStart.toFormat("MMM d")} – {weekEnd.toFormat("MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button size="sm" onClick={() => setCreateShiftOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Shift
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
        <button
          onClick={() => setViewMode("week")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            viewMode === "week"
              ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
          )}
        >
          Week
        </button>
        <button
          onClick={() => setViewMode("month")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            viewMode === "month"
              ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
          )}
        >
          Month
        </button>
      </div>

      {/* Content */}
      {viewMode === "month" ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium">Month view coming soon</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Switch to week view to see your schedule.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-6">
          {/* Calendar Grid */}
          <Card
            className={cn(
              "flex-1 overflow-hidden",
              selectedShift && "lg:max-w-[calc(100%-320px)]",
            )}
          >
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Day Headers */}
                  <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-zinc-200 dark:border-zinc-800">
                    <div className="p-2" />
                    {weekDays.map((day) => (
                      <div
                        key={day.toISO()}
                        className={cn(
                          "border-l border-zinc-200 p-2 text-center dark:border-zinc-800",
                          isToday(day) && "bg-blue-50 dark:bg-blue-950/30",
                        )}
                      >
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {day.toFormat("EEE")}
                        </p>
                        <p
                          className={cn(
                            "text-lg font-semibold",
                            isToday(day)
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-zinc-900 dark:text-zinc-50",
                          )}
                        >
                          {day.toFormat("d")}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Time Grid */}
                  {isLoading ? (
                    <div className="p-6 space-y-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex gap-4">
                          <Skeleton className="h-4 w-10" />
                          <div className="flex-1 grid grid-cols-7 gap-2">
                            {Array.from({ length: 7 }).map((_, j) => (
                              <Skeleton key={j} className="h-8" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-[60px_repeat(7,1fr)]">
                      {/* Time Labels */}
                      <div className="relative">
                        {HOURS.map((hour) => (
                          <div
                            key={hour}
                            className="flex h-14 items-start justify-end pr-2 pt-0"
                          >
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              {DateTime.fromObject({ hour }).toFormat("h a")}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Day Columns */}
                      {weekDays.map((day) => {
                        const dayKey = day.toFormat("yyyy-MM-dd");
                        const dayShifts = shiftsByDay.get(dayKey) ?? [];

                        return (
                          <div
                            key={dayKey}
                            className={cn(
                              "relative border-l border-zinc-200 dark:border-zinc-800",
                              isToday(day) &&
                                "bg-blue-50/50 dark:bg-blue-950/10",
                            )}
                          >
                            {/* Hour lines */}
                            {HOURS.map((hour) => (
                              <div
                                key={hour}
                                className="h-14 border-b border-zinc-100 dark:border-zinc-900"
                              />
                            ))}

                            {/* Shift blocks */}
                            {dayShifts.map((shift) => {
                              const pos = getShiftPosition(shift);
                              const colorClass = getLocationColor(
                                shift.locationId,
                                locationIds,
                              );

                              return (
                                <button
                                  key={shift.id}
                                  onClick={() =>
                                    setSelectedShift(
                                      selectedShift?.id === shift.id
                                        ? null
                                        : shift,
                                    )
                                  }
                                  className={cn(
                                    "absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-1 text-left text-xs transition-shadow hover:shadow-md",
                                    colorClass,
                                    selectedShift?.id === shift.id &&
                                      "ring-2 ring-zinc-900 dark:ring-zinc-50",
                                  )}
                                  style={{
                                    top: pos.top,
                                    height: pos.height,
                                    minHeight: "24px",
                                  }}
                                >
                                  <p className="truncate font-medium leading-tight">
                                    {timezone.formatUserTime(
                                      shift.startTime,
                                      userTimezone,
                                      "h:mm a",
                                    )}
                                  </p>
                                  <p className="truncate leading-tight opacity-75">
                                    {shift.location?.name ?? "Unknown"}
                                  </p>
                                </button>
                              );
                            })}

                            {/* Empty state */}
                            {dayShifts.length === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-xs text-zinc-300 dark:text-zinc-700">
                                  No shifts
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shift Detail Panel */}
          {selectedShift && (
            <Card className="hidden w-80 shrink-0 lg:block">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">Shift Details</CardTitle>
                  <CardDescription>
                    {timezone
                      .toUserTime(selectedShift.startTime, userTimezone)
                      .toFormat(DATE_FORMATS.WEEK_DAY_DATE)}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditShiftOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedShift(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Time */}
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {formatShiftTime(selectedShift)}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Duration: {getShiftDuration(selectedShift)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {selectedShift.location?.name ?? "Unknown Location"}
                    </p>
                    {selectedShift.location?.address && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {selectedShift.location.address}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Headcount */}
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {selectedShift.requiredHeadcount} staff required
                    </p>
                  </div>
                </div>

                {/* Required Skill */}
                {selectedShift.requiredSkill && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Wrench className="mt-0.5 h-4 w-4 text-zinc-500" />
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium">Required Skill</p>
                        <Badge variant="secondary">
                          {selectedShift.requiredSkill}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}

                {/* Manager Action */}
                {(user?.role === "MANAGER" || user?.role === "ADMIN") && (
                  <>
                    <Separator />
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => setAssignStaffOpen(true)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Assign Staff
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <CreateShiftDialog
        open={createShiftOpen}
        onOpenChange={setCreateShiftOpen}
        defaultDate={weekStart.toFormat(DATE_FORMATS.DATE_ONLY)}
      />

      {selectedShift && (
        <>
          <AssignStaffDialog
            shift={selectedShift}
            open={assignStaffOpen}
            onOpenChange={setAssignStaffOpen}
            userTimezone={userTimezone}
          />
          <EditShiftDialog
            shift={selectedShift}
            open={editShiftOpen}
            onOpenChange={(open) => {
              setEditShiftOpen(open);
              if (!open) setSelectedShift(null);
            }}
            userTimezone={userTimezone}
          />
        </>
      )}
    </div>
  );
}
