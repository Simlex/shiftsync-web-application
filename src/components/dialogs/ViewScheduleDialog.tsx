import { DATE_FORMATS } from "@/constants";
import { api } from "@/lib/api-client";
import { extractData } from "@/lib/utils";
import { Shift, User } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

type Props = {
  member: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ViewScheduleDialog({
  member,
  open,
  onOpenChange,
}: Props) {
  const [weekStart, setWeekStart] = useState(() =>
    DateTime.now().startOf("week"),
  );
  const weekEnd = weekStart.endOf("week");

  const { data: shiftsRaw, isLoading } = useQuery({
    queryKey: ["shifts", "schedule", member.id, weekStart.toISODate()],
    queryFn: async () => {
      const res = await api.shifts.getShifts({
        userId: member.id,
        startDate: weekStart.toISO()!,
        endDate: weekEnd.toISO()!,
      });
      return res.data as { data: Shift[] } | Shift[];
    },
    enabled: open,
  });

  const shifts = extractData(shiftsRaw ?? []);

  const shiftsByDay = useMemo(() => {
    const grouped: Record<string, Shift[]> = {};
    for (const shift of shifts) {
      const dayKey = DateTime.fromISO(shift.startTime).toFormat(
        DATE_FORMATS.DATE_ONLY,
      );
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(shift);
    }
    // Sort shifts within each day
    for (const key of Object.keys(grouped)) {
      grouped[key].sort(
        (a, b) =>
          DateTime.fromISO(a.startTime).toMillis() -
          DateTime.fromISO(b.startTime).toMillis(),
      );
    }
    return grouped;
  }, [shifts]);

  const goToPrevWeek = useCallback(
    () => setWeekStart((w) => w.minus({ weeks: 1 })),
    [],
  );
  const goToNextWeek = useCallback(
    () => setWeekStart((w) => w.plus({ weeks: 1 })),
    [],
  );
  const goToThisWeek = useCallback(
    () => setWeekStart(DateTime.now().startOf("week")),
    [],
  );

  // Generate all 7 days of the week for the grid
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i })),
    [weekStart],
  );

  const isCurrentWeek =
    weekStart.toISODate() === DateTime.now().startOf("week").toISODate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule — {member.name}</DialogTitle>
          <DialogDescription>
            Week of {weekStart.toFormat(DATE_FORMATS.DISPLAY_DATE)} –{" "}
            {weekEnd.toFormat(DATE_FORMATS.DISPLAY_DATE)}
          </DialogDescription>
        </DialogHeader>

        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={goToPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToThisWeek}
            disabled={isCurrentWeek}
          >
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Schedule grid */}
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            weekDays.map((day) => {
              const key = day.toFormat(DATE_FORMATS.DATE_ONLY);
              const dayShifts = shiftsByDay[key] ?? [];
              const isToday = day.toISODate() === DateTime.now().toISODate();

              return (
                <div
                  key={key}
                  className={`rounded-md border p-2 ${
                    isToday
                      ? "border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/30"
                      : "border-zinc-100 dark:border-zinc-800"
                  }`}
                >
                  <p className="text-xs font-semibold">
                    {day.toFormat(DATE_FORMATS.WEEK_DAY_DATE)}
                    {isToday && (
                      <span className="ml-1.5 text-[10px] font-normal text-blue-600 dark:text-blue-400">
                        Today
                      </span>
                    )}
                  </p>
                  {dayShifts.length === 0 ? (
                    <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                      No shifts
                    </p>
                  ) : (
                    <div className="mt-1 space-y-1">
                      {dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between rounded bg-zinc-50 px-2 py-1 text-xs dark:bg-zinc-900"
                        >
                          <span className="font-medium">
                            {DateTime.fromISO(shift.startTime).toFormat(
                              DATE_FORMATS.TIME_ONLY,
                            )}{" "}
                            –{" "}
                            {DateTime.fromISO(shift.endTime).toFormat(
                              DATE_FORMATS.TIME_ONLY,
                            )}
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {shift.location?.name ?? "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
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
