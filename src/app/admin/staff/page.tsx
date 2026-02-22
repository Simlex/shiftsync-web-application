"use client";

import { useState, useMemo } from "react";
import {
  Search,
  UserPlus,
  MapPin,
  Clock,
  Shield,
  X,
  Calendar,
  ChevronRight,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/constants/routes";
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
import type { User, UserRole } from "@/types";

// --------------------------------------------------------------------------
// Role badge configuration
// --------------------------------------------------------------------------

const ROLE_BADGE_STYLES: Record<UserRole, { label: string; className: string }> = {
  ADMIN: {
    label: "Admin",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  MANAGER: {
    label: "Manager",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  STAFF: {
    label: "Staff",
    className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
};

type RoleFilter = "ALL" | UserRole;

// --------------------------------------------------------------------------
// Placeholder data – ready to replace with API integration
// --------------------------------------------------------------------------

const PLACEHOLDER_STAFF: User[] = [
  {
    id: "1",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "MANAGER",
    timezone: "America/New_York",
    skills: ["Opening", "Closing", "Training"],
    desiredWeeklyHours: 40,
    createdAt: "2025-08-01T00:00:00Z",
    updatedAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Mike Rivera",
    email: "mike.r@example.com",
    role: "STAFF",
    timezone: "America/Chicago",
    skills: ["Register", "Stocking"],
    desiredWeeklyHours: 30,
    createdAt: "2025-09-15T00:00:00Z",
    updatedAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "3",
    name: "Sarah Thompson",
    email: "sarah.t@example.com",
    role: "STAFF",
    timezone: "America/Los_Angeles",
    skills: ["Register"],
    desiredWeeklyHours: 25,
    createdAt: "2025-10-01T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "4",
    name: "Alex Morgan",
    email: "alex.m@example.com",
    role: "ADMIN",
    timezone: "America/New_York",
    skills: ["Opening", "Closing", "Training", "Inventory"],
    desiredWeeklyHours: 40,
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "5",
    name: "Jordan Lee",
    email: "jordan.l@example.com",
    role: "STAFF",
    timezone: "America/Denver",
    skills: ["Stocking", "Inventory"],
    desiredWeeklyHours: 20,
    createdAt: "2025-11-01T00:00:00Z",
    updatedAt: "2026-01-28T00:00:00Z",
  },
];

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

function StaffDetailPanel({
  member,
  onClose,
}: {
  member: User;
  onClose: () => void;
}) {
  const roleStyle = ROLE_BADGE_STYLES[member.role];

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
              {formatTimezone(member.timezone)}
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

        <Separator />

        {/* Recent shifts summary */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Recent Shifts</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No recent shift data available.
          </p>
        </div>

        <Separator />

        {/* Availability overview */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Availability</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Availability data will appear once the schedule module is connected.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4" />
            Edit Role
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4" />
            View Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
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

  // For now, use placeholder data since there's no /users list endpoint.
  // The component is ready to integrate when the API is available.
  const isLoading = false;
  const staff = PLACEHOLDER_STAFF;

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        search === "" ||
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole =
        roleFilter === "ALL" || member.role === roleFilter;
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
        <Button>
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
              <CardContent className="flex flex-col items-center justify-center py-12">
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
                      isSelected
                        ? "border-zinc-900 dark:border-zinc-100"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedMemberId(isSelected ? null : member.id)
                    }
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Avatar
                          size="lg"
                          fallback={getInitials(member.name)}
                        />
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
                          {formatTimezone(member.timezone)}
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
    </div>
  );
}
