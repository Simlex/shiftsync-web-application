"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  MapPin,
  Clock,
  Shield,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api, getErrorMessage } from "@/lib/api-client";
import { timezone } from "@/lib/timezone";
import { useAuth } from "@/contexts/auth-context";
import { DATE_FORMATS } from "@/constants";
import { extractData } from "@/lib/utils";
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
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, UserRole, Shift, CreateUser } from "@/types";
import { useFetchUsers } from "@/hooks/users";

// --------------------------------------------------------------------------
// Role badge configuration
// --------------------------------------------------------------------------

const ROLE_BADGE_STYLES: Record<
  UserRole,
  { label: string; className: string }
> = {
  ADMIN: {
    label: "Admin",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  MANAGER: {
    label: "Manager",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  STAFF: {
    label: "Staff",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
};

// --------------------------------------------------------------------------
// Form validation schema
// --------------------------------------------------------------------------

const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["STAFF", "MANAGER", "ADMIN"] as const).optional(),
  preferredTimezone: z.string().optional(),
  desiredWeeklyHours: z.number().min(0).max(80).optional(),
});

type RoleFilter = "ALL" | UserRole;

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTimezone(tz: string): string {
  return tz.replace(/_/g, " ").split("/").pop() ?? tz;
}

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------

function StaffCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}

function EditRoleDialog({
  member,
  open,
  onOpenChange,
}: {
  member: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(member.role);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (role: UserRole) => api.users.updateUser(member.id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`${member.name}'s role updated to ${selectedRole}`);
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const hasChanged = selectedRole !== member.role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>
            Change the role for {member.name} ({member.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label>Role</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["STAFF", "MANAGER"] as const).map((role) => {
              const style = ROLE_BADGE_STYLES[role];
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`flex items-center gap-2 rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                    isSelected
                      ? "border-zinc-900 dark:border-zinc-100"
                      : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                  }`}
                >
                  <Badge variant="outline" className={style.className}>
                    {style.label}
                  </Badge>
                </button>
              );
            })}
          </div>
          {selectedRole !== member.role && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              This will change {member.name}&apos;s permissions immediately.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate(selectedRole)}
            disabled={!hasChanged || mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewScheduleDialog({
  member,
  open,
  onOpenChange,
}: {
  member: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [weekStart, setWeekStart] = useState(() =>
    DateTime.now().startOf("week"),
  );
  const weekEnd = weekStart.endOf("week");

  const { data: shiftsRaw, isLoading } = useQuery({
    queryKey: ["shifts", "schedule", member.id, weekStart.toISODate()],
    queryFn: async () => {
      const res = await api.shifts.getShifts({
        userId: member.id,
        startDate: weekStart.toISO()!,
        endDate: weekEnd.toISO()!,
      });
      return res.data as { data: Shift[] } | Shift[];
    },
    enabled: open,
  });

  const shifts = extractData(shiftsRaw ?? []);

  const shiftsByDay = useMemo(() => {
    const grouped: Record<string, Shift[]> = {};
    for (const shift of shifts) {
      const dayKey = DateTime.fromISO(shift.startTime).toFormat(
        DATE_FORMATS.DATE_ONLY,
      );
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(shift);
    }
    // Sort shifts within each day
    for (const key of Object.keys(grouped)) {
      grouped[key].sort(
        (a, b) =>
          DateTime.fromISO(a.startTime).toMillis() -
          DateTime.fromISO(b.startTime).toMillis(),
      );
    }
    return grouped;
  }, [shifts]);

  const goToPrevWeek = useCallback(
    () => setWeekStart((w) => w.minus({ weeks: 1 })),
    [],
  );
  const goToNextWeek = useCallback(
    () => setWeekStart((w) => w.plus({ weeks: 1 })),
    [],
  );
  const goToThisWeek = useCallback(
    () => setWeekStart(DateTime.now().startOf("week")),
    [],
  );

  // Generate all 7 days of the week for the grid
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i })),
    [weekStart],
  );

  const isCurrentWeek =
    weekStart.toISODate() === DateTime.now().startOf("week").toISODate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule — {member.name}</DialogTitle>
          <DialogDescription>
            Week of {weekStart.toFormat(DATE_FORMATS.DISPLAY_DATE)} –{" "}
            {weekEnd.toFormat(DATE_FORMATS.DISPLAY_DATE)}
          </DialogDescription>
        </DialogHeader>

        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={goToPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToThisWeek}
            disabled={isCurrentWeek}
          >
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Schedule grid */}
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            weekDays.map((day) => {
              const key = day.toFormat(DATE_FORMATS.DATE_ONLY);
              const dayShifts = shiftsByDay[key] ?? [];
              const isToday = day.toISODate() === DateTime.now().toISODate();

              return (
                <div
                  key={key}
                  className={`rounded-md border p-2 ${
                    isToday
                      ? "border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/30"
                      : "border-zinc-100 dark:border-zinc-800"
                  }`}
                >
                  <p className="text-xs font-semibold">
                    {day.toFormat(DATE_FORMATS.WEEK_DAY_DATE)}
                    {isToday && (
                      <span className="ml-1.5 text-[10px] font-normal text-blue-600 dark:text-blue-400">
                        Today
                      </span>
                    )}
                  </p>
                  {dayShifts.length === 0 ? (
                    <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                      No shifts
                    </p>
                  ) : (
                    <div className="mt-1 space-y-1">
                      {dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between rounded bg-zinc-50 px-2 py-1 text-xs dark:bg-zinc-900"
                        >
                          <span className="font-medium">
                            {DateTime.fromISO(shift.startTime).toFormat(
                              DATE_FORMATS.TIME_ONLY,
                            )}{" "}
                            –{" "}
                            {DateTime.fromISO(shift.endTime).toFormat(
                              DATE_FORMATS.TIME_ONLY,
                            )}
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {shift.location?.name ?? "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StaffDetailPanel({
  member,
  onClose,
}: {
  member: User;
  onClose: () => void;
}) {
  const roleStyle = ROLE_BADGE_STYLES[member.role];
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const isStaff = member.role === "STAFF";

  const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
    queryKey: ["shifts", "user", member.id],
    queryFn: async () => {
      const res = await api.shifts.getShifts({ userId: member.id });
      return res.data as { data: Shift[] } | Shift[];
    },
    enabled: isStaff,
  });

  const { data: availabilityData, isLoading: availabilityLoading } = useQuery({
    queryKey: ["availability", member.id],
    queryFn: async () => {
      const res = await api.users.getUser(member.id);
      return res.data;
    },
  });

  const recentShifts = extractData(shiftsData)
    .sort(
      (a, b) =>
        DateTime.fromISO(b.startTime).toMillis() -
        DateTime.fromISO(a.startTime).toMillis(),
    )
    .slice(0, 5);

  const userAvailability = (availabilityData as any)?.availability ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar size="lg" fallback={getInitials(member.name)} />
          <div>
            <CardTitle className="text-xl">{member.name}</CardTitle>
            <CardDescription>{member.email}</CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Role
            </p>
            <Badge variant="outline" className={roleStyle.className}>
              {roleStyle.label}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Timezone
            </p>
            <p className="flex items-center gap-1 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {formatTimezone(member.preferredTimezone)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Desired Weekly Hours
            </p>
            <p className="flex items-center gap-1 text-sm">
              <Clock className="h-3.5 w-3.5" />
              {member.desiredWeeklyHours ?? "Not set"}h
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Status
            </p>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Active</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Skills */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {member.skills.length > 0 ? (
              member.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No skills listed
              </p>
            )}
          </div>
        </div>

        {isStaff && (
          <>
            <Separator />

            {/* Recent shifts summary */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Recent Shifts</p>
              {shiftsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : recentShifts.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No shifts found for this user.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between rounded-md border border-zinc-100 p-2 text-xs dark:border-zinc-800"
                    >
                      <div>
                        <p className="font-medium">
                          {DateTime.fromISO(shift.startTime).toFormat(
                            DATE_FORMATS.DISPLAY_DATE,
                          )}
                        </p>
                        <p className="text-zinc-500 dark:text-zinc-400">
                          {DateTime.fromISO(shift.startTime).toFormat(
                            DATE_FORMATS.TIME_ONLY,
                          )}{" "}
                          –{" "}
                          {DateTime.fromISO(shift.endTime).toFormat(
                            DATE_FORMATS.TIME_ONLY,
                          )}
                        </p>
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400">
                        {shift.location?.name ?? "Unknown"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {isStaff && (
          <>
            <Separator />

            {/* Availability overview */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Availability</p>
              {availabilityLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : userAvailability.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No availability data set.
                </p>
              ) : (
                <div className="space-y-1">
                  {userAvailability.map((avail: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="font-medium">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                          avail.dayOfWeek
                        ] ?? `Day ${avail.dayOfWeek}`}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {avail.startTime} – {avail.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Quick actions */}
        <div className="flex gap-2">
          {member.role !== "ADMIN" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditRoleOpen(true)}
            >
              <Shield className="h-4 w-4" />
              Edit Role
            </Button>
          )}
          {isStaff && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScheduleOpen(true)}
            >
              <Calendar className="h-4 w-4" />
              View Schedule
            </Button>
          )}
        </div>
      </CardContent>

      {isStaff && (
        <ViewScheduleDialog
          member={member}
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
        />
      )}

      {member.role !== "ADMIN" && (
        <EditRoleDialog
          member={member}
          open={editRoleOpen}
          onOpenChange={setEditRoleOpen}
        />
      )}
    </Card>
  );
}

// --------------------------------------------------------------------------
// Add Staff Dialog
// --------------------------------------------------------------------------

function AddStaffDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "STAFF",
      preferredTimezone: "UTC",
      desiredWeeklyHours: 40,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateUser) => api.users.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Staff member added successfully");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const onSubmit = (data: z.infer<typeof createUserSchema>) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Create a new staff member account. They will receive login
            credentials via email.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporary Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter temporary password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferredTimezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <Input placeholder="UTC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="desiredWeeklyHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="80"
                        placeholder="40"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Adding..." : "Add Staff Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --------------------------------------------------------------------------
// Page
// --------------------------------------------------------------------------

export default function StaffManagementPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addStaffOpen, setAddStaffOpen] = useState(false);

  const { data: staff = [], isLoading } = useFetchUsers();

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        search === "" ||
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staff, search, roleFilter]);
  const selectedMember = staff.find((m) => m.id === selectedMemberId) ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Staff Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage your team members and their roles
          </p>
        </div>
        <Button onClick={() => setAddStaffOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <option value="ALL">All Roles</option>
          <option value="STAFF">Staff</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Staff grid */}
        <div className={selectedMember ? "lg:col-span-2" : "lg:col-span-3"}>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <StaffCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12!">
                <Users className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm font-medium">No staff found</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {search || roleFilter !== "ALL"
                    ? "Try adjusting your filters"
                    : "Add team members to get started"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredStaff.map((member) => {
                const roleStyle = ROLE_BADGE_STYLES[member.role];
                const isSelected = selectedMemberId === member.id;

                return (
                  <Card
                    key={member.id}
                    className={`cursor-pointer transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 ${
                      isSelected ? "border-zinc-900 dark:border-zinc-100" : ""
                    }`}
                    onClick={() =>
                      setSelectedMemberId(isSelected ? null : member.id)
                    }
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Avatar size="lg" fallback={getInitials(member.name)} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {member.email}
                          </p>
                          <Badge
                            variant="outline"
                            className={`mt-1.5 ${roleStyle.className}`}
                          >
                            {roleStyle.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            Active
                          </span>
                        </div>
                      </div>

                      {/* Skills */}
                      {member.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {member.skills.slice(0, 3).map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {member.skills.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              +{member.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {formatTimezone(member.preferredTimezone)}
                        </span>
                        {member.desiredWeeklyHours != null && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {member.desiredWeeklyHours}h/wk
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedMember && (
          <div className="lg:col-span-1">
            <StaffDetailPanel
              member={selectedMember}
              onClose={() => setSelectedMemberId(null)}
            />
          </div>
        )}
      </div>

      <AddStaffDialog open={addStaffOpen} onOpenChange={setAddStaffOpen} />
    </div>
  );
}
