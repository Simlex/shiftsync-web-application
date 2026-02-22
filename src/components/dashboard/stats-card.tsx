"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  trend?: { value: number; label: string };
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "bg-zinc-900 dark:bg-zinc-50",
  trend,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white dark:text-zinc-900",
              iconColor
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-sm">
            {trend.value >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span
              className={cn(
                "font-medium",
                trend.value >= 0 ? "text-green-500" : "text-red-500"
              )}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
