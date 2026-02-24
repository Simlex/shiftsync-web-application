"use client";

import { useState, useMemo } from "react";
import { DateTime } from "luxon";
import {
  Clock,
  BarChart3,
  ArrowLeftRight,
  AlertTriangle,
  TrendingUp,
  PieChart,
  Activity,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard, StatsCardSkeleton } from "@/components/dashboard/stats-card";
import { useFetchShifts } from "@/hooks/shifts";

type DateRange = "7d" | "30d" | "month";

const DATE_RANGE_OPTIONS: { id: DateRange; label: string }[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "month", label: "This Month" },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("7d");

  const dateParams = useMemo(() => {
    const now = DateTime.now();
    let start: DateTime;
    if (dateRange === "7d") {
      start = now.minus({ days: 7 });
    } else if (dateRange === "30d") {
      start = now.minus({ days: 30 });
    } else {
      start = now.startOf("month");
    }
    return {
      startDate: start.toUTC().toISO() ?? "",
      endDate: now.toUTC().toISO() ?? "",
    };
  }, [dateRange]);

  const { data: shifts = [], isLoading } = useFetchShifts(
    dateParams,
    !!dateParams.startDate && !!dateParams.endDate,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics &amp; Reports
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            System-wide performance metrics and insights
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
          {DATE_RANGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setDateRange(option.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                dateRange === option.id
                  ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
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
              title="Total Shifts"
              value={shifts.length}
              icon={Clock}
              iconColor="bg-blue-500"
            />
            <StatsCard
              title="Unique Locations"
              value={new Set(shifts.map((s: any) => s.locationId)).size}
              icon={BarChart3}
              iconColor="bg-emerald-500"
            />
            <StatsCard
              title="Avg Headcount / Shift"
              value={
                shifts.length > 0
                  ? (
                      shifts.reduce((sum: number, s: any) => sum + (s.headcount || 0), 0) /
                      shifts.length
                    ).toFixed(1)
                  : "0"
              }
              icon={ArrowLeftRight}
              iconColor="bg-purple-500"
            />
            <StatsCard
              title="Period"
              value={dateRange === "7d" ? "7 Days" : dateRange === "30d" ? "30 Days" : "This Month"}
              icon={AlertTriangle}
              iconColor="bg-amber-500"
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shift Coverage</CardTitle>
            <CardDescription>
              Daily shift fill rate over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="mb-3 h-12 w-12 text-zinc-200 dark:text-zinc-700" />
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Chart coming soon
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Integrate Recharts to visualize shift coverage trends
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hours Distribution</CardTitle>
            <CardDescription>
              Weekly hours worked per staff member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PieChart className="mb-3 h-12 w-12 text-zinc-200 dark:text-zinc-700" />
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Chart coming soon
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Integrate Recharts to visualize hours distribution
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Trends</CardTitle>
            <CardDescription>
              Swap and drop request volume over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingUp className="mb-3 h-12 w-12 text-zinc-200 dark:text-zinc-700" />
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Chart coming soon
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Integrate Recharts to visualize request trends
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Staff Performance</CardTitle>
            <CardDescription>
              Attendance and reliability scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="mb-3 h-12 w-12 text-zinc-200 dark:text-zinc-700" />
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Chart coming soon
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Integrate Recharts to visualize staff performance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
