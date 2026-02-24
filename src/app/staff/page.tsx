"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import {
  Calendar,
  Clock,
  ArrowLeftRight,
  ArrowDownToLine,
  Bell,
  Info,
  CalendarCheck,
  Settings2,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { timezone } from "@/lib/timezone";
import { useAuth } from "@/contexts/auth-context";
import { useNotifications } from "@/hooks/notifications";
import { getShiftStatusVariant, getShiftStatusLabel } from "@/lib/shift-status";
import { DATE_FORMATS } from "@/constants";
import { extractData } from "@/lib/utils";
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
import {
  StatsCard,
  StatsCardSkeleton,
} from "@/components/dashboard/stats-card";
import type { SwapRequest, DropRequest, Shift } from "@/types";

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const userTimezone = user?.preferredTimezone ?? "UTC";

  const now = DateTime.now().setZone(userTimezone);
  const todayDisplay = now.toFormat(DATE_FORMATS.WEEK_DAY_DATE);

  const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
    queryKey: ["shifts", "upcoming"],
    queryFn: async () => {
      const res = await api.shifts.getShifts({
        startDate: DateTime.now().toUTC().toISO() ?? undefined,
      });
      return res.data as { data: Shift[] } | Shift[];
    },
    retry: false,
  });

  const { data: swapsData, isLoading: swapsLoading } = useQuery({
    queryKey: ["swaps", "pending"],
    queryFn: async () => {
      const res = await api.swaps.getSwaps({ status: "PENDING" });
      return res.data as { data: SwapRequest[] } | SwapRequest[];
    },
    retry: false,
  });

  const { data: dropsData, isLoading: dropsLoading } = useQuery({
    queryKey: ["drops", "open"],
    queryFn: async () => {
      const res = await api.drops.getDrops({ status: "OPEN" });
      return res.data as { data: DropRequest[] } | DropRequest[];
    },
    retry: false,
  });

  const { data: notificationsData, isLoading: notificationsLoading } =
    useNotifications({
      limit: 5,
      read: false,
    });

  const weekStart = now.startOf("week").toUTC().toISO() ?? "";
  const weekEnd = now.endOf("week").toUTC().toISO() ?? "";

  const { data: weekShiftsData, isLoading: weekShiftsLoading } = useQuery({
    queryKey: ["shifts", "week-hours", weekStart, weekEnd],
    queryFn: async () => {
      const res = await api.shifts.getMyShifts({
        startDate: weekStart,
        endDate: weekEnd,
      });
      return res.data as { data: Shift[] } | Shift[];
    },
    enabled: !!weekStart && !!weekEnd,
    retry: false,
  });

  const shifts = extractData(shiftsData);
  const swaps = extractData(swapsData);
  const drops = extractData(dropsData);
  const weekShifts = extractData(weekShiftsData);
  const notifications = extractData(notificationsData);

  const hoursThisWeek = useMemo(() => {
    return weekShifts.reduce((total, assignment) => {
      const start = DateTime.fromISO(assignment.startTime);
      const end = DateTime.fromISO(assignment.endTime);
      return total + end.diff(start).as("hours");
    }, 0);
  }, [weekShifts]);

  const upcomingShifts = shifts.slice(0, 5);

  const isLoading =
    shiftsLoading ||
    swapsLoading ||
    dropsLoading ||
    weekShiftsLoading ||
    notificationsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name ?? "Staff"}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">{todayDisplay}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <CalendarCheck className="mr-2 h-4 w-4" />
            View Schedule
          </Button>
          <Button variant="outline" size="sm">
            <Settings2 className="mr-2 h-4 w-4" />
            Manage Availability
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="Upcoming Shifts"
              value={shifts.length}
              icon={Calendar}
              iconColor="bg-blue-500"
            />
            <StatsCard
              title="Hours This Week"
              value={Math.round(hoursThisWeek * 10) / 10}
              subtitle={`/${user?.desiredWeeklyHours ?? 40}h`}
              icon={Clock}
              iconColor="bg-emerald-500"
            />
            <StatsCard
              title="Pending Swaps"
              value={swaps.length}
              icon={ArrowLeftRight}
              iconColor="bg-amber-500"
            />
            <StatsCard
              title="Open Drops"
              value={drops.length}
              icon={ArrowDownToLine}
              iconColor="bg-purple-500"
            />
          </>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - wider */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Shifts</CardTitle>
              <CardDescription>Your next scheduled shifts</CardDescription>
            </CardHeader>
            <CardContent>
              {shiftsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : upcomingShifts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-sm font-medium">No upcoming shifts</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    You don&apos;t have any shifts scheduled yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {upcomingShifts.map((shift, i) => {
                    const start = timezone.formatUserTime(
                      shift.startTime,
                      userTimezone,
                      DATE_FORMATS.DISPLAY_DATETIME,
                    );
                    const end = timezone.formatUserTime(
                      shift.endTime,
                      userTimezone,
                      DATE_FORMATS.TIME_ONLY,
                    );
                    const status = shift.status || "DRAFT"; // Use API status or fallback

                    return (
                      <div key={shift.id}>
                        <button className="flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                            <span className="text-xs font-medium leading-none">
                              {timezone
                                .toUserTime(shift.startTime, userTimezone)
                                .toFormat("MMM")}
                            </span>
                            <span className="text-lg font-bold leading-none">
                              {timezone
                                .toUserTime(shift.startTime, userTimezone)
                                .toFormat("d")}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {start} – {end}
                            </p>
                            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                              {shift.location?.name ?? "Unknown Location"}
                            </p>
                          </div>
                          <Badge variant={getShiftStatusVariant(status)}>
                            {getShiftStatusLabel(status)}
                          </Badge>
                        </button>
                        {i < upcomingShifts.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
              <CardDescription>Your swap &amp; drop requests</CardDescription>
            </CardHeader>
            <CardContent>
              {swapsLoading || dropsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-6 w-14" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : swaps.length === 0 && drops.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Info className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No pending requests
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {swaps.map((swap) => (
                    <div
                      key={swap.id}
                      className="flex items-start gap-3 rounded-lg p-2"
                    >
                      <Badge variant="secondary">Swap</Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          Swap with {swap.toUser?.name ?? "another staff"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {timezone.formatUserTime(
                            swap.createdAt,
                            userTimezone,
                            DATE_FORMATS.DISPLAY_DATE,
                          )}
                        </p>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                  ))}
                  {drops.map((drop) => (
                    <div
                      key={drop.id}
                      className="flex items-start gap-3 rounded-lg p-2"
                    >
                      <Badge variant="secondary">Drop</Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          Shift drop request
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {timezone.formatUserTime(
                            drop.createdAt,
                            userTimezone,
                            DATE_FORMATS.DISPLAY_DATE,
                          )}
                        </p>
                      </div>
                      <Badge variant="outline">Open</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>Recent updates</CardDescription>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Bell className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No new notifications
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 rounded-lg p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                          {timezone.formatUserTime(
                            notification.createdAt,
                            userTimezone,
                            "MMM d, h:mm a",
                          )}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
