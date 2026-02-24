"use client";

import Link from "next/link";
import {
  Users,
  MapPin,
  Calendar,
  Activity,
  BarChart3,
  ClipboardList,
  UserCog,
  ChevronRight,
} from "lucide-react";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  StatsCard,
  StatsCardSkeleton,
} from "@/components/dashboard/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFetchUsers } from "@/hooks/users";
import { useFetchLocations } from "@/hooks/locations";
import { useFetchShifts } from "@/hooks/shifts";
import { User } from "@/types";

const QUICK_ACTIONS = [
  {
    id: "staff",
    title: "Staff Management",
    description: "Manage users, roles, and permissions",
    icon: UserCog,
    href: ROUTES.ADMIN_STAFF,
  },
  {
    id: "schedule",
    title: "Schedule Management",
    description: "Create and manage work schedules",
    icon: Calendar,
    href: ROUTES.ADMIN_SCHEDULE,
  },
  {
    id: "requests",
    title: "Request Management",
    description: "Review shift swaps, drops, and requests",
    icon: ClipboardList,
    href: ROUTES.ADMIN_REQUESTS,
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "View reports and system analytics",
    icon: BarChart3,
    href: ROUTES.ADMIN_ANALYTICS,
  },
];

export default function AdminDashboardPage() {
  const { data: users = [], isLoading: usersLoading } = useFetchUsers();
  const { data: locations = [], isLoading: locationsLoading } =
    useFetchLocations();

  const weekStart = DateTime.now().startOf("week").toUTC().toISO() ?? "";
  const weekEnd = DateTime.now().endOf("week").toUTC().toISO() ?? "";
  const { data: shifts = [], isLoading: shiftsLoading } = useFetchShifts(
    { startDate: weekStart, endDate: weekEnd },
    !!weekStart && !!weekEnd,
  );

  const isLoading = usersLoading || locationsLoading || shiftsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Administration overview · Last 7 days
        </p>
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
              title="Total Users"
              value={users.length}
              icon={Users}
              iconColor="bg-blue-500"
            />
            <StatsCard
              title="Active Locations"
              value={locations.length}
              icon={MapPin}
              iconColor="bg-emerald-500"
            />
            <StatsCard
              title="Shifts This Week"
              value={shifts.length}
              icon={Calendar}
              iconColor="bg-amber-500"
            />
            <StatsCard
              title="System Health"
              value="Operational"
              icon={Activity}
              iconColor="bg-green-500"
            />
          </>
        )}
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Overview</CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                  >
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "Total Shifts (This Week)",
                    value: String(shifts.length),
                  },
                  {
                    label: "Active Staff",
                    value: String(
                      users.filter((u: User) => u.role === "STAFF").length,
                    ),
                  },
                  {
                    label: "Managers",
                    value: String(
                      users.filter((u: User) => u.role === "MANAGER").length,
                    ),
                  },
                  { label: "Locations", value: String(locations.length) },
                  { label: "Total Users", value: String(users.length) },
                  {
                    label: "Admins",
                    value: String(
                      users.filter((u: User) => u.role === "ADMIN").length,
                    ),
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
                  >
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>User &amp; location management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {QUICK_ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <div key={action.id}>
                    <Link
                      href={action.href}
                      className="flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{action.title}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                    </Link>
                    {i < QUICK_ACTIONS.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent System Activity - full width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent System Activity</CardTitle>
            <CardDescription>Admin-level activity log</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
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
