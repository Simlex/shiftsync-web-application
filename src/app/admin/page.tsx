"use client";

import {
  Users,
  MapPin,
  Calendar,
  Activity,
  Settings,
  ShieldCheck,
  Building2,
  UserCog,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatsCard } from "@/components/dashboard/stats-card";

// Placeholder metrics
const SYSTEM_METRICS = [
  { label: "Total Shifts (This Week)", value: "156" },
  { label: "Shift Fill Rate", value: "94%" },
  { label: "Avg Hours / Staff", value: "34.2h" },
  { label: "Swap Success Rate", value: "87%" },
  { label: "Active Drop Requests", value: "3" },
  { label: "Overtime Incidents", value: "2" },
];

const QUICK_ACTIONS = [
  {
    id: "users",
    title: "Manage Users",
    description: "Add, edit, or deactivate user accounts",
    icon: UserCog,
  },
  {
    id: "roles",
    title: "Roles & Permissions",
    description: "Configure role-based access control",
    icon: ShieldCheck,
  },
  {
    id: "locations",
    title: "Manage Locations",
    description: "Add or configure work locations",
    icon: Building2,
  },
  {
    id: "settings",
    title: "System Settings",
    description: "Configure global application settings",
    icon: Settings,
  },
];

const RECENT_ACTIVITY = [
  {
    id: "1",
    action: "User created",
    detail: "admin@example.com added new user Maria K.",
    time: "15 min ago",
    type: "info" as const,
  },
  {
    id: "2",
    action: "Location added",
    detail: 'New location "North Campus" created',
    time: "1 hour ago",
    type: "info" as const,
  },
  {
    id: "3",
    action: "Role updated",
    detail: "James T. promoted to Manager",
    time: "3 hours ago",
    type: "info" as const,
  },
  {
    id: "4",
    action: "System alert",
    detail: "High API latency detected (resolved)",
    time: "Yesterday",
    type: "warning" as const,
  },
  {
    id: "5",
    action: "Backup completed",
    detail: "Daily database backup successful",
    time: "Yesterday",
    type: "success" as const,
  },
];

export default function AdminDashboardPage() {
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
        <StatsCard
          title="Total Users"
          value={128}
          icon={Users}
          iconColor="bg-blue-500"
          trend={{ value: 12, label: "this month" }}
        />
        <StatsCard
          title="Active Locations"
          value={8}
          icon={MapPin}
          iconColor="bg-emerald-500"
        />
        <StatsCard
          title="Shifts This Week"
          value={156}
          icon={Calendar}
          iconColor="bg-amber-500"
          trend={{ value: 8, label: "vs last week" }}
        />
        <StatsCard
          title="System Health"
          value="Operational"
          icon={Activity}
          iconColor="bg-green-500"
        />
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {SYSTEM_METRICS.map((metric) => (
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
                    <button className="flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
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
                    </button>
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
            <div className="space-y-1">
              {RECENT_ACTIVITY.map((activity, i) => {
                const iconMap = {
                  info: AlertCircle,
                  warning: AlertCircle,
                  success: CheckCircle2,
                };
                const colorMap = {
                  info: "text-blue-500",
                  warning: "text-amber-500",
                  success: "text-green-500",
                };
                const Icon = iconMap[activity.type];
                return (
                  <div key={activity.id}>
                    <div className="flex items-center gap-4 rounded-lg p-2">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800",
                          colorMap[activity.type]
                        )}
                      >
                        <Icon className="h-4 w-4" />
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
                    {i < RECENT_ACTIVITY.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
