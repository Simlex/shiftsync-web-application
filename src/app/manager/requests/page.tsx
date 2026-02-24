"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  ArrowDownToLine,
  Check,
  X,
  Clock,
  Send,
  Inbox,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { extractData } from "@/lib/utils";
import { timezone } from "@/lib/timezone";
import { DATE_FORMATS } from "@/constants";
import { useDrops, useExtendDropRequest } from "@/hooks/drops";
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
import { Skeleton } from "@/components/ui/skeleton";
import type {
  SwapRequest,
  SwapRequestStatus,
  DropRequestStatus,
} from "@/types";

// --------------------------------------------------------------------------
// Types & constants
// --------------------------------------------------------------------------

type SwapFilter = "ALL" | SwapRequestStatus;
type DropFilter = "ALL" | DropRequestStatus;

const SWAP_STATUS_BADGE: Record<
  SwapRequestStatus,
  {
    variant: "warning" | "success" | "destructive" | "secondary" | "outline";
    label: string;
  }
> = {
  PENDING: { variant: "warning", label: "Pending" },
  ACCEPTED: { variant: "success", label: "Accepted" },
  REJECTED: { variant: "destructive", label: "Rejected" },
  CANCELLED: { variant: "outline", label: "Cancelled" },
  EXPIRED: { variant: "secondary", label: "Expired" },
};

const DROP_STATUS_BADGE: Record<
  DropRequestStatus,
  { variant: "default" | "success" | "secondary" | "outline"; label: string }
> = {
  OPEN: { variant: "default", label: "Open" },
  CLAIMED: { variant: "success", label: "Claimed" },
  EXPIRED: { variant: "secondary", label: "Expired" },
  CANCELLED: { variant: "outline", label: "Cancelled" },
};

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
    </div>
  );
}

function RejectInput({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Rejection reason..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="h-8 w-48 text-xs"
      />
      <Button
        variant="destructive"
        size="sm"
        className="h-8"
        disabled={reason.trim() === "" || isPending}
        onClick={() => onSubmit(reason.trim())}
      >
        <Send className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="sm" className="h-8" onClick={onCancel}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function formatShiftTime(
  startTime: string | undefined,
  userTimezone: string,
): string {
  if (!startTime) return "—";
  return timezone.formatUserTime(
    startTime,
    userTimezone,
    DATE_FORMATS.DISPLAY_DATETIME,
  );
}

// --------------------------------------------------------------------------
// Page
// --------------------------------------------------------------------------

export default function RequestManagementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userTz = user?.preferredTimezone ?? "UTC";

  const [swapFilter, setSwapFilter] = useState<SwapFilter>("ALL");
  const [dropFilter, setDropFilter] = useState<DropFilter>("ALL");
  const [rejectingSwapId, setRejectingSwapId] = useState<string | null>(null);

  // ---- Swap requests query ----
  const {
    data: swapsRaw,
    isLoading: swapsLoading,
    isError: swapsError,
  } = useQuery({
    queryKey: ["swaps", "manager"],
    queryFn: async () => {
      const res = await api.swaps.getSwaps();
      return res.data as { data: SwapRequest[] } | SwapRequest[];
    },
    retry: false,
  });

  // ---- Drop requests query using hooks ----
  const {
    data: drops = [],
    isLoading: dropsLoading,
    isError: dropsError,
  } = useDrops();

  // ---- Mutations ----
  const approveSwap = useMutation({
    mutationFn: (id: string) => api.swaps.approveSwap(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swaps"] });
    },
  });

  const rejectSwap = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.swaps.rejectSwap(id, reason),
    onSuccess: () => {
      setRejectingSwapId(null);
      queryClient.invalidateQueries({ queryKey: ["swaps"] });
    },
  });

  const extendDropMutation = useExtendDropRequest();

  // ---- Derived data ----
  const swaps = extractData<SwapRequest>(swapsRaw);

  const filteredSwaps =
    swapFilter === "ALL" ? swaps : swaps.filter((s) => s.status === swapFilter);

  const filteredDrops =
    dropFilter === "ALL" ? drops : drops.filter((d) => d.status === dropFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Request Management
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Review and manage swap and drop requests from your team
        </p>
      </div>

      {/* Swap Requests */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-zinc-500" />
              <div>
                <CardTitle className="text-lg">Swap Requests</CardTitle>
                <CardDescription>
                  Shift swap requests between team members
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-1">
              {(["ALL", "PENDING", "ACCEPTED", "REJECTED"] as const).map(
                (filter) => (
                  <Button
                    key={filter}
                    variant={swapFilter === filter ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSwapFilter(filter)}
                  >
                    {filter === "ALL"
                      ? "All"
                      : filter.charAt(0) + filter.slice(1).toLowerCase()}
                  </Button>
                ),
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {swapsLoading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : swapsError || filteredSwaps.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No swap requests"
              description={
                swapsError
                  ? "Failed to load swap requests"
                  : "No swap requests match the current filter"
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <th className="pb-3 pr-4">Initiator</th>
                    <th className="pb-3 pr-4">Their Shift</th>
                    <th className="pb-3 pr-4">Target</th>
                    <th className="pb-3 pr-4">Target&apos;s Shift</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredSwaps.map((swap) => {
                    const statusBadge = SWAP_STATUS_BADGE[swap.status];
                    const isRejecting = rejectingSwapId === swap.id;

                    return (
                      <tr key={swap.id}>
                        <td className="py-3 pr-4 font-medium">
                          {swap.requestedBy?.name ?? swap.requestedById}
                        </td>
                        <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">
                          {formatShiftTime(
                            swap.fromAssignment?.shift?.startTime,
                            userTz,
                          )}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {swap.toUser?.name ?? swap.toUserId}
                        </td>
                        <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">
                          {formatShiftTime(swap.shift?.startTime, userTz)}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">
                          {timezone.formatUserTime(
                            swap.createdAt,
                            userTz,
                            DATE_FORMATS.DISPLAY_DATE,
                          )}
                        </td>
                        <td className="py-3">
                          {swap.status === "PENDING" && (
                            <div className="flex items-center gap-2">
                              {isRejecting ? (
                                <RejectInput
                                  isPending={rejectSwap.isPending}
                                  onSubmit={(reason) =>
                                    rejectSwap.mutate({
                                      id: swap.id,
                                      reason,
                                    })
                                  }
                                  onCancel={() => setRejectingSwapId(null)}
                                />
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    disabled={approveSwap.isPending}
                                    onClick={() => approveSwap.mutate(swap.id)}
                                  >
                                    <Check className="h-3 w-3" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-red-600 hover:text-red-700 dark:text-red-400"
                                    onClick={() => setRejectingSwapId(swap.id)}
                                  >
                                    <X className="h-3 w-3" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drop Requests */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-zinc-500" />
              <div>
                <CardTitle className="text-lg">Drop Requests</CardTitle>
                <CardDescription>
                  Shift drop requests from team members
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-1">
              {(["ALL", "OPEN", "CLAIMED", "EXPIRED"] as const).map(
                (filter) => (
                  <Button
                    key={filter}
                    variant={dropFilter === filter ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDropFilter(filter)}
                  >
                    {filter === "ALL"
                      ? "All"
                      : filter.charAt(0) + filter.slice(1).toLowerCase()}
                  </Button>
                ),
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dropsLoading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : dropsError || filteredDrops.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No drop requests"
              description={
                dropsError
                  ? "Failed to load drop requests"
                  : "No drop requests match the current filter"
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <th className="pb-3 pr-4">Staff Member</th>
                    <th className="pb-3 pr-4">Shift</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Expiry</th>
                    <th className="pb-3 pr-4">Claimed By</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredDrops.map((drop) => {
                    const statusBadge = DROP_STATUS_BADGE[drop.status];

                    return (
                      <tr key={drop.id}>
                        <td className="py-3 pr-4 font-medium">
                          {drop.user?.name ?? drop.userId}
                        </td>
                        <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">
                          {formatShiftTime(
                            drop.shift?.shift?.startTime,
                            userTz,
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timezone.formatUserTime(
                              drop.expiresAt,
                              userTz,
                              DATE_FORMATS.DISPLAY_DATETIME,
                            )}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">
                          {drop.claimedBy?.name ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">
                          {timezone.formatUserTime(
                            drop.createdAt,
                            userTz,
                            DATE_FORMATS.DISPLAY_DATE,
                          )}
                        </td>
                        <td className="py-3">
                          {drop.status === "OPEN" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              disabled={extendDropMutation.isPending}
                              onClick={() => extendDropMutation.mutate(drop.id)}
                            >
                              <Clock className="h-3 w-3" />
                              Extend
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
