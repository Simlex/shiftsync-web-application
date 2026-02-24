"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
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
  Send,
  Archive,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { timezone } from "@/lib/timezone";
import { useAuth } from "@/contexts/auth-context";
import { usePublishShift, useUnpublishShift } from "@/hooks/shifts";
import { DATE_FORMATS } from "@/constants";
import { cn, extractData, getLocationColor } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { Shift } from "@/types";
import CreateShiftDialog from "@/components/dialogs/CreateShiftDialog";
import AssignStaffDialog from "@/components/dialogs/AssignStaffDialog";
import EditShiftDialog from "@/components/dialogs/EditShiftDialog";
import { HOURS } from "@/constants/schedule";

type ViewMode = "week" | "month";

interface ScheduleManagerProps {
  showManagementActions?: boolean; // Whether to show create/edit/publish actions
}

export default function ScheduleManager({
  showManagementActions = false,
}: ScheduleManagerProps) {
  const { user } = useAuth();
  const userTimezone = user?.preferredTimezone ?? "UTC";

  const publishShift = usePublishShift();
  const unpublishShift = useUnpublishShift();

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentWeek, setCurrentWeek] = useState(() =>
    DateTime.now().startOf("week"),
  );
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Dialog states
  const [createShiftOpen, setCreateShiftOpen] = useState(false);
  const [assignStaffOpen, setAssignStaffOpen] = useState(false);
  const [editShiftOpen, setEditShiftOpen] = useState(false);

  // Week navigation
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => currentWeek.plus({ days: i }));
  }, [currentWeek]);

  const weekStartISO = weekDays[0].startOf("day").toUTC().toISO();
  const weekEndISO = weekDays[6].endOf("day").toUTC().toISO();

  // Data fetching
  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ["shifts", weekStartISO, weekEndISO],
    queryFn: async () => {
      const res = await api.shifts.getShifts({
        startDate: weekStartISO ?? undefined,
        endDate: weekEndISO ?? undefined,
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
      const dayShifts = map.get(shiftDay) ?? [];
      dayShifts.push(shift);
      map.set(shiftDay, dayShifts);
    });
    return map;
  }, [shifts, weekDays, userTimezone]);

  // Helper functions
  const isToday = (date: DateTime) => {
    return date.hasSame(DateTime.now().setZone(userTimezone), "day");
  };

  const getShiftPosition = (shift: Shift) => {
    const startTime = timezone.toUserTime(shift.startTime, userTimezone);
    const endTime = timezone.toUserTime(shift.endTime, userTimezone);
    const startHour = startTime.hour + startTime.minute / 60;
    const endHour = endTime.hour + endTime.minute / 60;
    const duration = endHour - startHour;
    const top = (startHour - 6) * 56; // 56px per hour (14 * 4)
    const height = duration * 56;
    return { top, height: Math.max(height, 24) };
  };

  const handleShiftAction = (action: string, shift: Shift) => {
    setSelectedShift(shift);
    switch (action) {
      case "assign":
        setAssignStaffOpen(true);
        break;
      case "edit":
        setEditShiftOpen(true);
        break;
      case "publish":
        publishShift.mutate(shift.id);
        break;
      case "unpublish":
        unpublishShift.mutate(shift.id);
        break;
    }
  };

  const formatWeekRange = () => {
    const start = weekDays[0].toFormat("MMM d");
    const end = weekDays[6].toFormat("MMM d, yyyy");
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage shifts and assignments for your team
          </p>
        </div>

        {showManagementActions && (
          <div className="flex gap-2">
            <Button
              onClick={() => setCreateShiftOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Shift
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 p-1 dark:border-zinc-800">
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(currentWeek.minus({ weeks: 1 }))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <span className="text-sm font-medium">{formatWeekRange()}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(currentWeek.plus({ weeks: 1 }))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(DateTime.now().startOf("week"))}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Calendar Grid */}
        <Card
          className={cn(
            "flex-1 overflow-hidden",
            selectedShift && "lg:max-w-[calc(100%-320px)]",
          )}
        >
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-175">
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
                            "text-sm font-semibold",
                            isToday(day) && "text-blue-600 dark:text-blue-400",
                          )}
                        >
                          {day.toFormat("d")}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Time Grid */}
                  {viewMode === "week" && (
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
            )}
          </CardContent>
        </Card>

        {/* Shift Detail Panel */}
        {selectedShift && (
          <Card className="hidden w-80 shrink-0 lg:block">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-lg">Shift Details</CardTitle>
                <Badge
                  variant={selectedShift.isPublished ? "default" : "secondary"}
                >
                  {selectedShift.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedShift(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time & Location */}
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-zinc-500" />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">
                    {timezone.formatUserTime(
                      selectedShift.startTime,
                      userTimezone,
                      "h:mm a",
                    )}{" "}
                    -{" "}
                    {timezone.formatUserTime(
                      selectedShift.endTime,
                      userTimezone,
                      "h:mm a",
                    )}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {timezone.formatUserTime(
                      selectedShift.startTime,
                      userTimezone,
                      DATE_FORMATS.DISPLAY_DATE,
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-zinc-500" />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {selectedShift.location?.name ?? "Unknown Location"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Staffing */}
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 text-zinc-500" />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Staffing</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {selectedShift.assignments?.length ?? 0} /{" "}
                    {selectedShift.requiredHeadcount} staff assigned
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

              {/* Management Actions */}
              {showManagementActions && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      size="sm"
                      onClick={() => handleShiftAction("assign", selectedShift)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Assign Staff
                    </Button>

                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      size="sm"
                      onClick={() => handleShiftAction("edit", selectedShift)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Shift
                    </Button>

                    {selectedShift.isPublished ? (
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleShiftAction("unpublish", selectedShift)
                        }
                        disabled={unpublishShift.isPending}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Unpublish
                      </Button>
                    ) : (
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleShiftAction("publish", selectedShift)
                        }
                        disabled={publishShift.isPending}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Publish Shift
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      {showManagementActions && (
        <>
          <CreateShiftDialog
            open={createShiftOpen}
            onOpenChange={setCreateShiftOpen}
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
                onOpenChange={setEditShiftOpen}
                userTimezone={userTimezone}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
