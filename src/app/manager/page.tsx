"use client";

import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import {
  Users,
  Calendar,
  ClipboardList,
  BarChart3,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { extractData } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  StatsCard,
  StatsCardSkeleton,
} from "@/components/dashboard/stats-card";
import { useFetchUsers } from "@/hooks/users";
import { useFetchShifts } from "@/hooks/shifts";
import type { Location } from "@/types";

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

  const { data: allUsers = [], isLoading: usersLoading } = useFetchUsers();

  const todayStart = DateTime.now().startOf("day").toUTC().toISO() ?? "";
  const todayEnd = DateTime.now().endOf("day").toUTC().toISO() ?? "";
  const { data: todayShifts = [], isLoading: todayShiftsLoading } =
    useFetchShifts(
      { startDate: todayStart, endDate: todayEnd },
      !!todayStart && !!todayEnd,
    );

  const locations = extractData(locationsData);
  const staffUsers = allUsers.filter(
    (u: any) => u.role === "STAFF" || u.role === "MANAGER",
  );

  const pendingSwaps = extractData(swapsData);
  const openDrops = extractData(dropsData);
  const pendingCount = pendingSwaps.length + openDrops.length;

  const isLoading =
    locationsLoading ||
    swapsLoading ||
    dropsLoading ||
    usersLoading ||
    todayShiftsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manager Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Overview of your managed locations
          </p>
        </div>
        <div>
          <select className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <option>All Locations</option>
            {locations.map((loc: any) => (
              <option key={loc.id}>{loc.name}</option>
            ))}
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
              value={staffUsers.length}
              icon={Users}
              iconColor="bg-blue-500"
            />
            <StatsCard
              title="Shifts Today"
              value={todayShifts.length}
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
              title="Locations"
              value={locations.length}
              icon={BarChart3}
              iconColor="bg-purple-500"
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
                {locations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No locations found
                    </p>
                  </div>
                ) : (
                  locations.map((location: any) => (
                    <div key={location.id}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-sm font-medium">{location.name}</p>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          {location.timezone}
                        </span>
                      </div>
                      {location.address && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {location.address}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Items</CardTitle>
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
            ) : pendingCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
                <p className="text-sm font-medium">All clear</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No pending requests at this time
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {pendingSwaps.length > 0 && (
                  <div className="flex items-start gap-3 rounded-lg p-2">
                    <Badge variant="warning">Swaps</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {pendingSwaps.length} pending swap request
                        {pendingSwaps.length > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Review and approve or reject
                      </p>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  </div>
                )}
                {pendingSwaps.length > 0 && openDrops.length > 0 && (
                  <Separator />
                )}
                {openDrops.length > 0 && (
                  <div className="flex items-start gap-3 rounded-lg p-2">
                    <Badge variant="default">Drops</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {openDrops.length} open drop request
                        {openDrops.length > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Shifts available for claiming
                      </p>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity - full width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>
              Latest actions across your locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm font-medium">No recent activity</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Activity tracking will be available soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
