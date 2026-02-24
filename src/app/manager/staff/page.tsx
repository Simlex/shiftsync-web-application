"use client";
import { useState, useMemo } from "react";
import { Search, MapPin, Clock, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { formatTimezone, getInitials } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import type { RoleFilter } from "@/types";
import { useFetchUsers } from "@/hooks/users";
import { ROLE_BADGE_STYLES } from "@/constants/role-config";
import StaffCardSkeleton from "@/components/skeleton/StaffCardSkeleton";
import StaffDetailPanel from "@/components/panel/StaffDetailPanel";

export default function StaffManagementPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const { data: allStaff = [], isLoading } = useFetchUsers();

  // Filter staff based on manager's access - managers can only see STAFF role users
  const accessibleStaff = useMemo(() => {
    return allStaff.filter((member) => {
      // Managers can only see STAFF members, not ADMIN or other MANAGER users
      // (unless viewing themselves)
      if (member.id === user?.id) {
        return true; // Always show themselves
      }
      return member.role === "STAFF";
    });
  }, [allStaff, user?.id]);

  const filteredStaff = useMemo(() => {
    return accessibleStaff.filter((member) => {
      const matchesSearch =
        search === "" ||
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [accessibleStaff, search, roleFilter]);

  const selectedMember =
    accessibleStaff.find((m) => m.id === selectedMemberId) ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            View and manage your team members
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Staff Grid */}
      <div className="flex gap-6">
        <div className={selectedMember ? "flex-1" : "w-full"}>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <StaffCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm font-medium">No team members found</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {search
                    ? "Try adjusting your search or filters"
                    : "No team members available"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStaff.map((member) => {
                const badgeStyle = ROLE_BADGE_STYLES[member.role];
                return (
                  <Card
                    key={member.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedMemberId === member.id
                        ? "ring-2 ring-zinc-900 dark:ring-zinc-50"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedMemberId(
                        selectedMemberId === member.id ? null : member.id,
                      )
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800">
                          <span className="text-sm font-medium">
                            {getInitials(member.name)}
                          </span>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">
                              {member.name}
                            </h3>
                            <Badge className={badgeStyle.className}>
                              {member.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                            {member.email}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {formatTimezone(member.preferredTimezone)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {member.desiredWeeklyHours || 40}h/week
                            </div>
                          </div>
                          {member.skills && member.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {member.skills.slice(0, 2).map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {member.skills.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{member.skills.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedMember && (
          <div className="hidden lg:block">
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
