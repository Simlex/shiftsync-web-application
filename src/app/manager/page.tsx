"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Calendar,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserPlus,
  ArrowLeftRight,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
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
import { StatsCard, StatsCardSkeleton } from "@/components/dashboard/stats-card";
import type { Location } from "@/types";

// Placeholder data for manager dashboard until API is connected
const PLACEHOLDER_LOCATIONS = [
  { id: "1", name: "Downtown Office", totalShifts: 24, staffed: 22, unstaffed: 2 },
  { id: "2", name: "West Branch", totalShifts: 18, staffed: 16, unstaffed: 2 },
  { id: "3", name: "East Campus", totalShifts: 12, staffed: 12, unstaffed: 0 },
];

const PLACEHOLDER_ISSUES = [
  {
    id: "1",
    type: "understaffed",
    severity: "critical" as const,
    title: "Understaffed: Downtown Office",
    description: "Morning shift on Feb 24 needs 2 more staff",
  },
  {
    id: "2",
    type: "overtime",
    severity: "warning" as const,
    title: "Overtime Warning",
    description: "John D. projected at 48h this week",
  },
  {
    id: "3",
    type: "expiring",
    severity: "warning" as const,
    title: "Expiring Drop Request",
    description: "Drop request for Feb 23 shift expires in 4 hours",
  },
];

const PLACEHOLDER_ACTIVITY = [
  { id: "1", action: "Shift assigned", detail: "Jane S. → Mon 9am–5pm", time: "10 min ago", icon: UserPlus },
  { id: "2", action: "Swap approved", detail: "Mike R. ↔ Sarah T.", time: "1 hour ago", icon: ArrowLeftRight },
  { id: "3", action: "Schedule published", detail: "Week of Feb 23", time: "2 hours ago", icon: Calendar },
  { id: "4", action: "New staff added", detail: "Alex M. joined the team", time: "Yesterday", icon: UserPlus },
];

export default function ManagerDashboardPage() {
  const { user } = useAuth();

  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const res = await api.locations.getLocations();
      return res.data as { data: Location[] } | Location[];
    },
    retry: false,
  });

  const { data: swapsData, isLoading: swapsLoading } = useQuery({
    queryKey: ["swaps", "pending", "manager"],
    queryFn: async () => {
      const res = await api.swaps.getSwaps({ status: "PENDING" });
      return res.data;
    },
    retry: false,
  });

  const { data: dropsData, isLoading: dropsLoading } = useQuery({
    queryKey: ["drops", "open", "manager"],
    queryFn: async () => {
      const res = await api.drops.getDrops({ status: "OPEN" });
      return res.data;
    },
    retry: false,
  });

  const pendingSwaps = extractData(swapsData);
  const openDrops = extractData(dropsData);
  const pendingCount = pendingSwaps.length + openDrops.length;

  const isLoading = locationsLoading || swapsLoading || dropsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Overview of your managed locations
          </p>
        </div>
        <div>
          <select className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <option>All Locations</option>
            <option>Downtown Office</option>
            <option>West Branch</option>
            <option>East Campus</option>
          </select>
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
              title="Total Staff"
              value={32}
              icon={Users}
              iconColor="bg-blue-500"
              trend={{ value: 5, label: "this month" }}
            />
            <StatsCard
              title="Shifts Today"
              value={14}
              icon={Calendar}
              iconColor="bg-emerald-500"
            />
            <StatsCard
              title="Pending Requests"
              value={pendingCount}
              icon={ClipboardList}
              iconColor={pendingCount > 0 ? "bg-amber-500" : "bg-zinc-400"}
            />
            <StatsCard
              title="Coverage Rate"
              value="92%"
              icon={BarChart3}
              iconColor="bg-purple-500"
              trend={{ value: 3, label: "vs last week" }}
            />
          </>
        )}
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Location Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location Overview</CardTitle>
            <CardDescription>Staffing levels across locations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                {PLACEHOLDER_LOCATIONS.map((location) => {
                  const coveragePercent =
                    location.totalShifts > 0
                      ? Math.round(
                          (location.staffed / location.totalShifts) * 100
                        )
                      : 100;
                  return (
                    <div key={location.id}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-sm font-medium">{location.name}</p>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          {location.staffed}/{location.totalShifts} staffed
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            coveragePercent === 100
                              ? "bg-green-500"
                              : coveragePercent >= 80
                                ? "bg-amber-500"
                                : "bg-red-500"
                          )}
                          style={{ width: `${coveragePercent}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {coveragePercent}% coverage
                        {location.unstaffed > 0 &&
                          ` · ${location.unstaffed} unfilled`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Critical Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Critical Issues</CardTitle>
            <CardDescription>Items needing your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-6 w-16" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : PLACEHOLDER_ISSUES.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
                <p className="text-sm font-medium">All clear</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No critical issues at this time
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {PLACEHOLDER_ISSUES.map((issue, i) => (
                  <div key={issue.id}>
                    <button className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <Badge
                        variant={
                          issue.severity === "critical"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {issue.severity === "critical" ? "Critical" : "Attention"}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{issue.title}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {issue.description}
                        </p>
                      </div>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                    </button>
                    {i < PLACEHOLDER_ISSUES.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity - full width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest actions across your locations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {PLACEHOLDER_ACTIVITY.map((activity, i) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id}>
                      <div className="flex items-center gap-4 rounded-lg p-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {activity.detail}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                          {activity.time}
                        </span>
                      </div>
                      {i < PLACEHOLDER_ACTIVITY.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
