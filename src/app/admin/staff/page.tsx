"use client";
import { useState, useMemo } from "react";
import { Search, UserPlus, MapPin, Clock, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { formatTimezone, getInitials } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import type { RoleFilter } from "@/types";
import { useFetchUsers } from "@/hooks/users";
import { ROLE_BADGE_STYLES } from "@/constants/role-config";
import StaffCardSkeleton from "@/components/skeleton/StaffCardSkeleton";
import StaffDetailPanel from "@/components/panel/StaffDetailPanel";
import AddStaffDialog from "@/components/dialogs/AddStaffDialog";

export default function StaffManagementPage() {
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
