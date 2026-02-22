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
} from "lucide-react";
import { api } from "@/lib/api-client";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { Shift } from "@/types";

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

export default function SchedulePage() {
  const { user } = useAuth();
  const userTimezone = user?.timezone ?? "UTC";

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const weekStart = useMemo(
    () =>
      DateTime.now()
        .setZone(userTimezone)
        .startOf("week")
        .plus({ weeks: weekOffset }),
    [userTimezone, weekOffset]
  );

  const weekEnd = useMemo(() => weekStart.endOf("week"), [weekStart]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i })),
    [weekStart]
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
        100
    );

    return { top: `${top}%`, height: `${height}%` };
  };

  const formatShiftTime = (shift: Shift) => {
    const start = timezone.formatUserTime(
      shift.startTime,
      userTimezone,
      "h:mm a"
    );
    const end = timezone.formatUserTime(
      shift.endTime,
      userTimezone,
      "h:mm a"
    );
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
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
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
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
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
          <Card className={cn("flex-1 overflow-hidden", selectedShift && "lg:max-w-[calc(100%-320px)]")}>
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
                          isToday(day) && "bg-blue-50 dark:bg-blue-950/30"
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
                              : "text-zinc-900 dark:text-zinc-50"
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
                              isToday(day) && "bg-blue-50/50 dark:bg-blue-950/10"
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
                                locationIds
                              );

                              return (
                                <button
                                  key={shift.id}
                                  onClick={() =>
                                    setSelectedShift(
                                      selectedShift?.id === shift.id
                                        ? null
                                        : shift
                                    )
                                  }
                                  className={cn(
                                    "absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-1 text-left text-xs transition-shadow hover:shadow-md",
                                    colorClass,
                                    selectedShift?.id === shift.id &&
                                      "ring-2 ring-zinc-900 dark:ring-zinc-50"
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
                                      "h:mm a"
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedShift(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
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
                      {selectedShift.headcount} staff required
                    </p>
                  </div>
                </div>

                {/* Required Skills */}
                {selectedShift.requiredSkills &&
                  selectedShift.requiredSkills.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <Wrench className="mt-0.5 h-4 w-4 text-zinc-500" />
                        <div className="space-y-1.5">
                          <p className="text-sm font-medium">Required Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedShift.requiredSkills.map((skill) => (
                              <Badge key={skill} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                {/* Description */}
                {selectedShift.description && (
                  <>
                    <Separator />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {selectedShift.description}
                    </p>
                  </>
                )}

                {/* Manager Action */}
                {(user?.role === "MANAGER" || user?.role === "ADMIN") && (
                  <>
                    <Separator />
                    <Button className="w-full" size="sm">
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
    </div>
  );
}
