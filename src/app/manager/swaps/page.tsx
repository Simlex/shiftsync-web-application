"use client";

import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { DateTime } from "luxon";
import {
  ArrowLeftRight,
  Send,
  Inbox,
  Plus,
  Filter,
  Check,
  X,
  Info,
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
import { Avatar } from "@/components/ui/avatar";
import type {
  SwapRequest,
  SwapRequestStatus,
  ShiftAssignment,
  User,
} from "@/types";

type Tab = "my-requests" | "incoming" | "create";

const TABS: { id: Tab; label: string; icon: typeof Send }[] = [
  { id: "my-requests", label: "My Requests", icon: Send },
  { id: "incoming", label: "Incoming", icon: Inbox },
  { id: "create", label: "Create Swap", icon: Plus },
];

const statusVariant = (status: SwapRequestStatus) => {
  switch (status) {
    case "PENDING":
      return "warning" as const;
    case "APPROVED":
      return "success" as const;
    case "REJECTED":
      return "destructive" as const;
  }
};

export default function SwapsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const userTimezone = user?.timezone ?? "UTC";

  const [activeTab, setActiveTab] = useState<Tab>("my-requests");
  const [statusFilter, setStatusFilter] = useState<SwapRequestStatus | "ALL">(
    "ALL"
  );
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Form state for Create Swap
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetShiftId, setTargetShiftId] = useState("");
  const [reason, setReason] = useState("");

  // Queries
  const { data: swapsData, isLoading: swapsLoading } = useQuery({
    queryKey: ["swaps", "my"],
    queryFn: async () => {
      const res = await api.swaps.getSwaps();
      return res.data as { data: SwapRequest[] } | SwapRequest[];
    },
  });

  const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
    queryKey: ["shifts", "my-assignments"],
    queryFn: async () => {
      const res = await api.shifts.getShifts({
        startDate: DateTime.now().toUTC().toISO() ?? undefined,
      });
      return res.data as { data: ShiftAssignment[] } | ShiftAssignment[];
    },
  });

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["users", "staff"],
    queryFn: async () => {
      const res = await api.users.getProfile();
      return [] as User[];
    },
    enabled: activeTab === "create",
  });

  const swaps = extractData(swapsData);
  const myShifts = extractData(shiftsData);

  const myRequests = swaps.filter((s) => s.initiatorId === user?.id);
  const incomingRequests = swaps.filter((s) => s.targetUserId === user?.id);

  const filteredMyRequests =
    statusFilter === "ALL"
      ? myRequests
      : myRequests.filter((s) => s.status === statusFilter);

  // Target user's shifts for create form
  const { data: targetShiftsData, isLoading: targetShiftsLoading } = useQuery({
    queryKey: ["shifts", "target", targetUserId],
    queryFn: async () => {
      const res = await api.shifts.getShifts({
        startDate: DateTime.now().toUTC().toISO() ?? undefined,
      });
      return res.data as { data: ShiftAssignment[] } | ShiftAssignment[];
    },
    enabled: !!targetUserId,
  });

  const targetShifts = extractData(targetShiftsData).filter(
    (s) => s.userId === targetUserId
  );

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => api.swaps.approveSwap(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swaps"] });
      toast.success("Swap Approved", "The swap request has been approved.");
    },
    onError: (error: unknown) => {
      toast.error("Failed to Approve", getErrorMessage(error));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.swaps.rejectSwap(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swaps"] });
      setRejectingId(null);
      setRejectionReason("");
      toast.success("Swap Rejected", "The swap request has been rejected.");
    },
    onError: (error: unknown) => {
      toast.error("Failed to Reject", getErrorMessage(error));
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.swaps.createSwap({
        initiatorShiftId: selectedShiftId,
        targetUserId,
        targetShiftId,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swaps"] });
      setSelectedShiftId("");
      setTargetUserId("");
      setTargetShiftId("");
      setReason("");
      setActiveTab("my-requests");
      toast.success("Swap Created", "Your swap request has been submitted.");
    },
    onError: (error: unknown) => {
      toast.error("Failed to Create Swap", getErrorMessage(error));
    },
  });

  const formatShiftTime = (assignment: ShiftAssignment) => {
    const start = timezone.formatUserTime(
      assignment.shift.startTime,
      userTimezone,
      DATE_FORMATS.DISPLAY_DATETIME
    );
    const end = timezone.formatUserTime(
      assignment.shift.endTime,
      userTimezone,
      DATE_FORMATS.TIME_ONLY
    );
    return `${start} – ${end}`;
  };

  const formatShiftLabel = (assignment: ShiftAssignment) => {
    const date = timezone.formatUserTime(
      assignment.shift.startTime,
      userTimezone,
      DATE_FORMATS.DISPLAY_DATE
    );
    const time = timezone.formatUserTime(
      assignment.shift.startTime,
      userTimezone,
      DATE_FORMATS.TIME_ONLY
    );
    const location = assignment.shift.location?.name ?? "Unknown Location";
    return `${date} ${time} — ${location}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Swap Requests</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Manage shift swap requests with your team
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "incoming" && incomingRequests.filter((r) => r.status === "PENDING").length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs text-white">
                  {incomingRequests.filter((r) => r.status === "PENDING").length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "my-requests" && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as SwapRequestStatus | "ALL")
              }
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <Card>
            <CardContent className="p-0">
              {swapsLoading ? (
                <div className="space-y-0 divide-y divide-zinc-200 dark:divide-zinc-800">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : filteredMyRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ArrowLeftRight className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-sm font-medium">No swap requests</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {statusFilter === "ALL"
                      ? "You haven't created any swap requests yet."
                      : `No ${statusFilter.toLowerCase()} swap requests.`}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredMyRequests.map((swap) => (
                    <div key={swap.id} className="flex items-center gap-4 p-4">
                      <Avatar
                        size="sm"
                        fallback={swap.targetUser?.name?.charAt(0) ?? "?"}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          Swap with{" "}
                          {swap.targetUser?.name ?? "Unknown User"}
                        </p>
                        <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {swap.initiatorShift && (
                            <span>
                              Your shift: {formatShiftTime(swap.initiatorShift)}
                            </span>
                          )}
                          {swap.targetShift && (
                            <span className="block">
                              Their shift: {formatShiftTime(swap.targetShift)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                          Requested{" "}
                          {timezone.formatUserTime(
                            swap.createdAt,
                            userTimezone,
                            DATE_FORMATS.DISPLAY_DATE
                          )}
                        </p>
                      </div>
                      <Badge variant={statusVariant(swap.status)}>
                        {swap.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "incoming" && (
        <Card>
          <CardContent className="p-0">
            {swapsLoading ? (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                ))}
              </div>
            ) : incomingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm font-medium">No incoming requests</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No one has requested a shift swap with you.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {incomingRequests.map((swap) => (
                  <div key={swap.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar
                        size="sm"
                        fallback={swap.initiator?.name?.charAt(0) ?? "?"}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {swap.initiator?.name ?? "Unknown User"}
                        </p>
                        <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {swap.initiatorShift && (
                            <span>
                              Their shift: {formatShiftTime(swap.initiatorShift)}
                            </span>
                          )}
                          {swap.targetShift && (
                            <span className="block">
                              Your shift: {formatShiftTime(swap.targetShift)}
                            </span>
                          )}
                        </div>
                        {swap.reason && (
                          <p className="mt-1 text-xs italic text-zinc-400 dark:text-zinc-500">
                            &ldquo;{swap.reason}&rdquo;
                          </p>
                        )}
                        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                          Requested{" "}
                          {timezone.formatUserTime(
                            swap.createdAt,
                            userTimezone,
                            DATE_FORMATS.DISPLAY_DATE
                          )}
                        </p>
                      </div>
                      <Badge variant={statusVariant(swap.status)}>
                        {swap.status}
                      </Badge>
                    </div>

                    {swap.status === "PENDING" && (
                      <div className="mt-3 flex items-center gap-2 pl-12">
                        {rejectingId === swap.id ? (
                          <div className="flex flex-1 items-center gap-2">
                            <Input
                              placeholder="Rejection reason..."
                              value={rejectionReason}
                              onChange={(e) =>
                                setRejectionReason(e.target.value)
                              }
                              className="h-9 text-sm"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={
                                !rejectionReason.trim() ||
                                rejectMutation.isPending
                              }
                              onClick={() =>
                                rejectMutation.mutate({
                                  id: swap.id,
                                  reason: rejectionReason,
                                })
                              }
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectionReason("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate(swap.id)}
                              disabled={approveMutation.isPending}
                            >
                              <Check className="mr-1 h-3.5 w-3.5" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectingId(swap.id)}
                            >
                              <X className="mr-1 h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {swap.status === "REJECTED" && swap.rejectionReason && (
                      <p className="mt-2 pl-12 text-xs text-red-500">
                        Reason: {swap.rejectionReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "create" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Swap Request</CardTitle>
            <CardDescription>
              Select your shift and the shift you&apos;d like to swap with
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Your Shift */}
              <div className="space-y-2">
                <Label htmlFor="my-shift">Your Shift</Label>
                {shiftsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : myShifts.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No upcoming shifts available to swap.
                  </p>
                ) : (
                  <select
                    id="my-shift"
                    value={selectedShiftId}
                    onChange={(e) => setSelectedShiftId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    <option value="">Select a shift...</option>
                    {myShifts
                      .filter((s) => s.status === "SCHEDULED")
                      .map((assignment) => (
                        <option key={assignment.id} value={assignment.id}>
                          {formatShiftLabel(assignment)}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Target User */}
              <div className="space-y-2">
                <Label htmlFor="target-user">Target Staff Member</Label>
                <Input
                  id="target-user"
                  placeholder="Enter staff member's user ID"
                  value={targetUserId}
                  onChange={(e) => {
                    setTargetUserId(e.target.value);
                    setTargetShiftId("");
                  }}
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Enter the user ID of the staff member you want to swap with
                </p>
              </div>

              {/* Target Shift */}
              <div className="space-y-2">
                <Label htmlFor="target-shift">Target Shift</Label>
                {!targetUserId ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Select a target staff member first.
                  </p>
                ) : targetShiftsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : targetShifts.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No upcoming shifts found for this user.
                  </p>
                ) : (
                  <select
                    id="target-shift"
                    value={targetShiftId}
                    onChange={(e) => setTargetShiftId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    <option value="">Select a shift...</option>
                    {targetShifts
                      .filter((s) => s.status === "SCHEDULED")
                      .map((assignment) => (
                        <option key={assignment.id} value={assignment.id}>
                          {formatShiftLabel(assignment)}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Input
                  id="reason"
                  placeholder="Why do you want to swap?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Separator />

              <Button
                onClick={() => createMutation.mutate()}
                disabled={
                  !selectedShiftId ||
                  !targetUserId ||
                  !targetShiftId ||
                  createMutation.isPending
                }
              >
                {createMutation.isPending ? "Submitting..." : "Submit Swap Request"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
