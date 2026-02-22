"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Save, Clock, CalendarOff, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { useUI } from "@/contexts/ui-context";
import { DAYS_OF_WEEK } from "@/constants";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type {
  RecurringAvailability,
  AvailabilityException,
  UserAvailability,
} from "@/types";

interface RecurringSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ExceptionEntry {
  date: string;
  unavailable: boolean;
  customStartTime: string;
  customEndTime: string;
}

function formatTime12h(time24: string): string {
  const [hourStr, minuteStr] = time24.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr ?? "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${ampm}`;
}

export default function AvailabilityPage() {
  const { user } = useAuth();
  const { addToast } = useUI();
  const queryClient = useQueryClient();

  const [recurring, setRecurring] = useState<RecurringSlot[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionEntry[]>([]);
  const [newExceptionDate, setNewExceptionDate] = useState("");
  const [newExceptionUnavailable, setNewExceptionUnavailable] = useState(true);
  const [newExceptionStart, setNewExceptionStart] = useState("09:00");
  const [newExceptionEnd, setNewExceptionEnd] = useState("17:00");
  const [initialized, setInitialized] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ["availability", user?.id],
    queryFn: async () => {
      const res = await api.users.getAvailability();
      return res.data as UserAvailability;
    },
    enabled: !!user?.id,
    retry: false,
    refetchOnWindowFocus: false,
    select: useCallback(
      (data: UserAvailability) => {
        if (!initialized) {
          setRecurring(
            data.recurring.map((r) => ({
              dayOfWeek: r.dayOfWeek,
              startTime: r.startTime,
              endTime: r.endTime,
            }))
          );
          setExceptions(
            data.exceptions.map((e) => ({
              date: e.date,
              unavailable: e.unavailable ?? !e.customHours,
              customStartTime: e.customHours?.startTime ?? "09:00",
              customEndTime: e.customHours?.endTime ?? "17:00",
            }))
          );
          setInitialized(true);
        }
        return data;
      },
      [initialized]
    ),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const recurringPayload: RecurringAvailability[] = recurring.map((r) => ({
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
      }));

      const exceptionsPayload: AvailabilityException[] = exceptions.map(
        (e) => ({
          date: e.date,
          ...(e.unavailable
            ? { unavailable: true }
            : {
                customHours: {
                  startTime: e.customStartTime,
                  endTime: e.customEndTime,
                },
              }),
        })
      );

      await api.users.updateAvailability({
        recurring: recurringPayload,
        exceptions: exceptionsPayload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      addToast({
        type: "success",
        title: "Availability saved",
        message: "Your availability has been updated successfully.",
      });
    },
    onError: () => {
      addToast({
        type: "error",
        title: "Save failed",
        message: "Could not save your availability. Please try again.",
      });
    },
  });

  const addSlot = (dayOfWeek: number) => {
    setRecurring((prev) => [
      ...prev,
      { dayOfWeek, startTime: "09:00", endTime: "17:00" },
    ]);
  };

  const removeSlot = (dayOfWeek: number, index: number) => {
    setRecurring((prev) => {
      const daySlots = prev.filter((s) => s.dayOfWeek === dayOfWeek);
      const otherSlots = prev.filter((s) => s.dayOfWeek !== dayOfWeek);
      daySlots.splice(index, 1);
      return [...otherSlots, ...daySlots];
    });
  };

  const updateSlot = (
    dayOfWeek: number,
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setRecurring((prev) => {
      const daySlots = prev.filter((s) => s.dayOfWeek === dayOfWeek);
      const otherSlots = prev.filter((s) => s.dayOfWeek !== dayOfWeek);
      daySlots[index] = { ...daySlots[index], [field]: value };
      return [...otherSlots, ...daySlots];
    });
  };

  const getSlotsForDay = (dayOfWeek: number) =>
    recurring.filter((s) => s.dayOfWeek === dayOfWeek);

  const addException = () => {
    if (!newExceptionDate) return;

    const alreadyExists = exceptions.some((e) => e.date === newExceptionDate);
    if (alreadyExists) {
      addToast({
        type: "warning",
        title: "Date already exists",
        message: "An exception for this date already exists.",
      });
      return;
    }

    setExceptions((prev) => [
      ...prev,
      {
        date: newExceptionDate,
        unavailable: newExceptionUnavailable,
        customStartTime: newExceptionStart,
        customEndTime: newExceptionEnd,
      },
    ]);
    setNewExceptionDate("");
    setNewExceptionUnavailable(true);
    setNewExceptionStart("09:00");
    setNewExceptionEnd("17:00");
  };

  const removeException = (index: number) => {
    setExceptions((prev) => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Manage Availability
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Set your recurring weekly schedule and date-specific exceptions.
        </p>
      </div>

      {/* Section 1: Weekly Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Template</CardTitle>
          <CardDescription>
            Set your recurring availability for each day of the week.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS_OF_WEEK.map((dayName, dayIndex) => {
            const slots = getSlotsForDay(dayIndex);

            return (
              <div key={dayName}>
                <div className="flex items-start gap-4">
                  <div className="w-24 shrink-0 pt-2">
                    <p className="text-sm font-medium">{dayName}</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {slots.length === 0 ? (
                      <p className="py-2 text-sm text-zinc-400 dark:text-zinc-500">
                        Not available
                      </p>
                    ) : (
                      slots.map((slot, slotIndex) => (
                        <div
                          key={`${dayIndex}-${slotIndex}`}
                          className="flex items-center gap-2"
                        >
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              updateSlot(
                                dayIndex,
                                slotIndex,
                                "startTime",
                                e.target.value
                              )
                            }
                            className="w-32"
                          />
                          <span className="text-sm text-zinc-500">to</span>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              updateSlot(
                                dayIndex,
                                slotIndex,
                                "endTime",
                                e.target.value
                              )
                            }
                            className="w-32"
                          />
                          <span className="text-xs text-zinc-400">
                            {formatTime12h(slot.startTime)} –{" "}
                            {formatTime12h(slot.endTime)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-zinc-400 hover:text-red-500"
                            onClick={() => removeSlot(dayIndex, slotIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={() => addSlot(dayIndex)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Slot
                    </Button>
                  </div>
                </div>
                {dayIndex < DAYS_OF_WEEK.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Section 2: Exceptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exceptions</CardTitle>
          <CardDescription>
            Override your weekly template for specific dates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing exceptions */}
          {exceptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CalendarOff className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No exceptions set
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {exceptions.map((exception, index) => (
                <div
                  key={`${exception.date}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{exception.date}</p>
                    {exception.unavailable ? (
                      <Badge variant="destructive" className="mt-1">
                        Unavailable
                      </Badge>
                    ) : (
                      <div className="mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formatTime12h(exception.customStartTime)} –{" "}
                          {formatTime12h(exception.customEndTime)}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-zinc-400 hover:text-red-500"
                    onClick={() => removeException(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Add exception form */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Add Exception</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="exception-date">Date</Label>
                <Input
                  id="exception-date"
                  type="date"
                  value={newExceptionDate}
                  onChange={(e) => setNewExceptionDate(e.target.value)}
                  className="w-44"
                />
              </div>

              <div className="space-y-1">
                <Label>Type</Label>
                <div className="flex gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
                  <button
                    onClick={() => setNewExceptionUnavailable(true)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      newExceptionUnavailable
                        ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                    )}
                  >
                    Unavailable
                  </button>
                  <button
                    onClick={() => setNewExceptionUnavailable(false)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      !newExceptionUnavailable
                        ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                    )}
                  >
                    Custom Hours
                  </button>
                </div>
              </div>

              {!newExceptionUnavailable && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="exception-start">Start</Label>
                    <Input
                      id="exception-start"
                      type="time"
                      value={newExceptionStart}
                      onChange={(e) => setNewExceptionStart(e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="exception-end">End</Label>
                    <Input
                      id="exception-end"
                      type="time"
                      value={newExceptionEnd}
                      onChange={(e) => setNewExceptionEnd(e.target.value)}
                      className="w-32"
                    />
                  </div>
                </>
              )}

              <Button
                size="sm"
                onClick={addException}
                disabled={!newExceptionDate}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Availability
        </Button>
      </div>
    </div>
  );
}
