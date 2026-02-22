"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import {
  ArrowDownToLine,
  Send,
  ShoppingCart,
  Plus,
  Clock,
  Check,
  X,
  Inbox,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { api, getErrorMessage } from "@/lib/api-client";
import { timezone } from "@/lib/timezone";
import { useAuth } from "@/contexts/auth-context";
import { DATE_FORMATS } from "@/constants";
import { cn, extractData } from "@/lib/utils";
import { useToast } from "@/hooks";
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
  DropRequest,
  DropRequestStatus,
  ShiftAssignment,
} from "@/types";

type Tab = "my-drops" | "open-board" | "create";

const TABS: { id: Tab; label: string; icon: typeof Send }[] = [
  { id: "my-drops", label: "My Drop Requests", icon: Send },
  { id: "open-board", label: "Available Drops", icon: ShoppingCart },
  { id: "create", label: "Create Drop", icon: Plus },
];

const statusVariant = (
  status: DropRequestStatus,
): "default" | "success" | "secondary" | "destructive" => {
  switch (status) {
    case "OPEN":
      return "default";
    case "CLAIMED":
      return "success";
    case "EXPIRED":
      return "secondary";
    case "CANCELLED":
      return "destructive";
  }
};

export default function DropsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const userTimezone = user?.timezone ?? "UTC";

  const [activeTab, setActiveTab] = useState<Tab>("my-drops");
  const [confirmClaimId, setConfirmClaimId] = useState<string | null>(null);

  // Form state for Create Drop
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryTime, setExpiryTime] = useState("23:59");
  const [reason, setReason] = useState("");

  // Queries
  const { data: dropsData, isLoading: dropsLoading } = useQuery({
    queryKey: ["drops", "all"],
    queryFn: async () => {
      const res = await api.drops.getDrops();
      return res.data as { data: DropRequest[] } | DropRequest[];
    },
    retry: false,
  });

  const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
    queryKey: ["shifts", "my-assignments-drops"],
    queryFn: async () => {
      const res = await api.shifts.getShifts({
        startDate: DateTime.now().toUTC().toISO() ?? undefined,
      });
      return res.data as { data: ShiftAssignment[] } | ShiftAssignment[];
    },
    enabled: activeTab === "create",
    retry: false,
  });

  const drops = extractData(dropsData);
  const myShifts = extractData(shiftsData);

  const myDrops = drops.filter((d) => d.userId === user?.id);
  const openDrops = drops.filter(
    (d) => d.status === "OPEN" && d.userId !== user?.id,
  );

  // Mutations
  const claimMutation = useMutation({
    mutationFn: (id: string) => api.drops.claimDrop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
      setConfirmClaimId(null);
      toast.success("Shift Claimed", "You have successfully claimed this shift.");
    },
    onError: (error: unknown) => {
      toast.error("Failed to Claim", getErrorMessage(error));
    },
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const expiresAt = expiryDate
        ? timezone
            .toUTC(expiryTime, expiryDate, userTimezone)
            .toISO() ?? undefined
        : undefined;
      return api.drops.createDrop({
        shiftId: selectedShiftId,
        reason: reason || undefined,
        expiresAt,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
      setSelectedShiftId("");
      setExpiryDate("");
      setExpiryTime("23:59");
      setReason("");
      setActiveTab("my-drops");
      toast.success("Drop Created", "Your drop request has been submitted.");
    },
    onError: (error: unknown) => {
      toast.error("Failed to Create Drop", getErrorMessage(error));
    },
  });

  const formatShiftLabel = (assignment: ShiftAssignment) => {
    const date = timezone.formatUserTime(
      assignment.shift.startTime,
      userTimezone,
      DATE_FORMATS.DISPLAY_DATE,
    );
    const time = timezone.formatUserTime(
      assignment.shift.startTime,
      userTimezone,
      DATE_FORMATS.TIME_ONLY,
    );
    const location = assignment.shift.location?.name ?? "Unknown";
    return `${date} ${time} — ${location}`;
  };

  const getExpiryDisplay = (expiresAt: string) => {
    const expiry = timezone.toUserTime(expiresAt, userTimezone);
    const now = DateTime.now().setZone(userTimezone);
    const diff = expiry.diff(now, ["hours", "minutes"]);

    if (diff.hours <= 0 && diff.minutes <= 0) {
      return { text: "Expired", urgent: true };
    }
    if (diff.hours < 4) {
      return {
        text: `${Math.floor(diff.hours)}h ${Math.floor(diff.minutes % 60)}m left`,
        urgent: true,
      };
    }
    return {
      text: timezone.formatUserTime(
        expiresAt,
        userTimezone,
        DATE_FORMATS.DISPLAY_DATETIME,
      ),
      urgent: false,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Drop Requests</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Drop shifts for others to claim or pick up available shifts
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count =
            tab.id === "open-board" ? openDrops.length : undefined;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {count !== undefined && count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs text-white">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* My Drop Requests */}
      {activeTab === "my-drops" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Drop Requests</CardTitle>
            <CardDescription>
              Shifts you&apos;ve submitted for others to claim
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dropsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-6 w-16" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : myDrops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ArrowDownToLine className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm font-medium">No drop requests</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  You haven&apos;t submitted any shift drop requests.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {myDrops.map((drop) => {
                  const expiry = getExpiryDisplay(drop.expiresAt);
                  return (
                    <div key={drop.id} className="flex items-start gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {drop.shift
                            ? timezone.formatUserTime(
                                drop.shift.shift.startTime,
                                userTimezone,
                                DATE_FORMATS.DISPLAY_DATETIME,
                              )
                            : "Shift details unavailable"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {drop.shift?.shift?.location?.name ?? "Unknown Location"}
                        </p>
                        {drop.reason && (
                          <p className="mt-1 text-xs italic text-zinc-400">
                            &ldquo;{drop.reason}&rdquo;
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-3">
                          <span
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              expiry.urgent
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-zinc-500 dark:text-zinc-400",
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            {expiry.text}
                          </span>
                          {drop.claimedBy && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Claimed
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={statusVariant(drop.status)}>
                        {drop.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Drops (Open Board) */}
      {activeTab === "open-board" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Drops</CardTitle>
            <CardDescription>
              Open shifts available for you to claim
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dropsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-9 w-28" />
                  </div>
                ))}
              </div>
            ) : openDrops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm font-medium">No available drops</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  There are no open shift drop requests right now.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {openDrops.map((drop) => {
                  const expiry = getExpiryDisplay(drop.expiresAt);
                  const isConfirming = confirmClaimId === drop.id;

                  return (
                    <div key={drop.id} className="py-4">
                      <div className="flex items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {drop.shift
                              ? timezone.formatUserTime(
                                  drop.shift.shift.startTime,
                                  userTimezone,
                                  DATE_FORMATS.DISPLAY_DATETIME,
                                )
                              : "Shift details unavailable"}
                            {" – "}
                            {drop.shift
                              ? timezone.formatUserTime(
                                  drop.shift.shift.endTime,
                                  userTimezone,
                                  DATE_FORMATS.TIME_ONLY,
                                )
                              : ""}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {drop.shift?.shift?.location?.name ?? "Unknown Location"}
                            {" · "}
                            Originally: {drop.user?.name ?? "Unknown"}
                          </p>
                          <span
                            className={cn(
                              "mt-1 flex items-center gap-1 text-xs",
                              expiry.urgent
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-zinc-500 dark:text-zinc-400",
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            Expires: {expiry.text}
                          </span>
                        </div>

                        {isConfirming ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => claimMutation.mutate(drop.id)}
                              disabled={claimMutation.isPending}
                            >
                              {claimMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmClaimId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmClaimId(drop.id)}
                          >
                            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                            Claim Shift
                          </Button>
                        )}
                      </div>

                      {isConfirming && (
                        <div className="mt-2 flex items-center gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          Are you sure? This shift will be assigned to you.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Drop */}
      {activeTab === "create" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Drop Request</CardTitle>
            <CardDescription>
              Submit one of your shifts for others to claim
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Select Shift */}
              <div className="space-y-2">
                <Label htmlFor="drop-shift">Select Shift</Label>
                {shiftsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : myShifts.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No upcoming shifts available to drop.
                  </p>
                ) : (
                  <select
                    id="drop-shift"
                    value={selectedShiftId}
                    onChange={(e) => setSelectedShiftId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    <option value="">Select a shift...</option>
                    {myShifts
                      .filter((s) => s.status === "SCHEDULED")
                      .map((assignment) => (
                        <option key={assignment.id} value={assignment.shiftId}>
                          {formatShiftLabel(assignment)}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Expiry */}
              <div className="space-y-2">
                <Label>Expiry</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-44"
                  />
                  <Input
                    type="time"
                    value={expiryTime}
                    onChange={(e) => setExpiryTime(e.target.value)}
                    className="w-32"
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  The request will expire if no one claims it by this time.
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="drop-reason">Reason (optional)</Label>
                <Input
                  id="drop-reason"
                  placeholder="Why are you dropping this shift?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Separator />

              <Button
                onClick={() => createMutation.mutate()}
                disabled={
                  !selectedShiftId || createMutation.isPending
                }
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                )}
                Submit Drop Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
