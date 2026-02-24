import { ROLE_BADGE_STYLES } from "@/constants/role-config";
import { api } from "@/lib/api-client";
import { extractData, formatTimezone, getInitials } from "@/lib/utils";
import { Shift, User } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Calendar, Clock, MapPin, Shield, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import { DATE_FORMATS } from "@/constants";
import ViewScheduleDialog from "../dialogs/ViewScheduleDialog";
import EditRoleDialog from "../dialogs/EditRoleDialog";

type Props = {
  member: User;
  onClose: () => void;
};

export default function StaffDetailPanel({ member, onClose }: Props) {
  const { user } = useAuth();
  const roleStyle = ROLE_BADGE_STYLES[member.role];
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const isStaff = member.role === "STAFF";
  const canEditRole = user?.role === "ADMIN" && member.role !== "ADMIN";

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
          {canEditRole && (
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

      {canEditRole && (
        <EditRoleDialog
          member={member}
          open={editRoleOpen}
          onOpenChange={setEditRoleOpen}
        />
      )}
    </Card>
  );
}
