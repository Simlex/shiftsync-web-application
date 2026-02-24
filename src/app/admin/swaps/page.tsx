"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Send,
  Inbox,
  Plus,
  Filter,
  Check,
  X,
} from "lucide-react";
import { timezone } from "@/lib/timezone";
import { useAuth } from "@/contexts/auth-context";
import { DATE_FORMATS } from "@/constants";
import { cn } from "@/lib/utils";
import { useToast } from "@/app/client-hooks";
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
import type { SwapRequestStatus, ShiftAssignment } from "@/types";
import { useFetchUsers } from "@/hooks/users";
import {
  useFetchSwaps,
  useFetchMyShifts,
  useCreateSwap,
  useApproveSwap,
  useRejectSwap,
} from "@/hooks/swaps";

type Tab = "all-requests" | "pending" | "create";

const TABS: { id: Tab; label: string; icon: typeof Send }[] = [
  { id: "all-requests", label: "All Requests", icon: Inbox },
  { id: "pending", label: "Pending Review", icon: ArrowLeftRight },
  { id: "create", label: "Create Swap", icon: Plus },
];

const statusVariant = (status: SwapRequestStatus) => {
  switch (status) {
    case "PENDING":
      return "warning" as const;
    case "ACCEPTED":
      return "success" as const;
    case "REJECTED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
};

export default function SwapsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const userTimezone = user?.preferredTimezone ?? "UTC";

  const [activeTab, setActiveTab] = useState<Tab>("all-requests");
  const [statusFilter, setStatusFilter] = useState<SwapRequestStatus | "ALL">(
    "ALL",
  );
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Form state for Create Swap
  const [selectedShiftId, setSelectedShiftId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [reason, setReason] = useState("");

  // Queries using proper hooks
  const { data: swaps = [], isLoading: swapsLoading } = useFetchSwaps();
  const { data: myShifts = [], isLoading: shiftsLoading } = useFetchMyShifts();
  const { data: staffList = [], isLoading: staffLoading } = useFetchUsers({
    role: "STAFF",
  });

  // Admin sees all swap requests
  const allRequests = swaps;
  const pendingRequests = swaps.filter((s) => s.status === "PENDING");

  const filteredRequests =
    statusFilter === "ALL"
      ? allRequests
      : allRequests.filter((s) => s.status === statusFilter);

  // Mutations
  const approveMutation = useApproveSwap();
  const rejectMutation = useRejectSwap();
  const createMutation = useCreateSwap();

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string, reason: string) => {
    rejectMutation.mutate(
      { id, reason },
      {
        onSuccess: () => {
          setRejectingId(null);
          setRejectionReason("");
        },
      },
    );
  };

  const handleCreate = () => {
    createMutation.mutate(
      {
        fromAssignmentId: selectedShiftId,
        toUserId: targetUserId,
        reason: reason || undefined,
      },
      {
        onSuccess: () => {
          setSelectedShiftId("");
          setTargetUserId("");
          setReason("");
          setActiveTab("all-requests");
        },
      },
    );
  };

  const formatShiftTime = (assignment: ShiftAssignment) => {
    const start = timezone.formatUserTime(
      assignment.shift.startTime,
      userTimezone,
      DATE_FORMATS.DISPLAY_DATETIME,
    );
    const end = timezone.formatUserTime(
      assignment.shift.endTime,
      userTimezone,
      DATE_FORMATS.TIME_ONLY,
    );
    return `${start} – ${end}`;
  };

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
    const location = assignment.shift.location?.name ?? "Unknown Location";
    return `${date} ${time} — ${location}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Swap Management</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Review and manage shift swap requests across all locations
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
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "pending" && pendingRequests.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs text-white">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {(activeTab === "all-requests" || activeTab === "pending") && (
        <div className="space-y-4">
          {/* Status Filter - only show for all-requests tab */}
          {activeTab === "all-requests" && (
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
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          )}

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
              ) : (activeTab === "pending" ? pendingRequests : filteredRequests)
                  .length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ArrowLeftRight className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-sm font-medium">
                    {activeTab === "pending"
                      ? "No pending requests"
                      : "No swap requests"}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {activeTab === "pending"
                      ? "All swap requests have been processed."
                      : statusFilter === "ALL"
                        ? "No swap requests have been created yet."
                        : `No ${statusFilter.toLowerCase()} swap requests.`}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {(activeTab === "pending"
                    ? pendingRequests
                    : filteredRequests
                  ).map((swap) => (
                    <div key={swap.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar
                          size="sm"
                          fallback={swap.requestedBy?.name?.charAt(0) ?? "?"}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {swap.requestedBy?.name ?? "Unknown User"} →{" "}
                            {swap.toUser?.name ?? "Unknown User"}
                          </p>
                          <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {swap.fromAssignment && (
                              <span>
                                Initiator shift:{" "}
                                {formatShiftTime(swap.fromAssignment)}
                              </span>
                            )}
                            {swap.toUser && (
                              <span className="block">
                                Target user: {swap.toUser.name}
                              </span>
                            )}
                          </div>
                          
                          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                            Requested{" "}
                            {timezone.formatUserTime(
                              swap.createdAt,
                              userTimezone,
                              DATE_FORMATS.DISPLAY_DATE,
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
                                  handleReject(swap.id, rejectionReason)
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
                                onClick={() => handleApprove(swap.id)}
                                disabled={approveMutation.isPending}
                              >
                                <Check className="mr-1 h-3.5 w-3.5" />
                                Approve
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

                      
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "create" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Swap Request</CardTitle>
            <CardDescription>
              Create a swap request between two staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Your Shift */}
              <div className="space-y-2">
                <Label htmlFor="initiator-shift">Initiator Shift</Label>
                {shiftsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : myShifts.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No upcoming shifts available.
                  </p>
                ) : (
                  <select
                    id="initiator-shift"
                    value={selectedShiftId}
                    onChange={(e) => setSelectedShiftId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    <option value="">Select an initiator shift...</option>
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
                {staffLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : staffList.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No staff members available.
                  </p>
                ) : (
                  <select
                    id="target-user"
                    value={targetUserId}
                    onChange={(e) => {
                      setTargetUserId(e.target.value);
                    }}
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    <option value="">Select a staff member...</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} ({staff.email})
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
                  placeholder="Reason for the swap request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Separator />

              <Button
                onClick={handleCreate}
                disabled={
                  !selectedShiftId || !targetUserId || createMutation.isPending
                }
              >
                {createMutation.isPending
                  ? "Creating..."
                  : "Create Swap Request"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
