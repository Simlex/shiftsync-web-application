"use client";
import { useParams } from "next/navigation";
import { ArrowLeft, Users, Mail, MapPin, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { getInitials, formatTimezone } from "@/lib/utils";
import { useFetchLocation, useFetchLocationStaff } from "@/hooks/locations";

export default function LocationStaffPage() {
  const params = useParams();
  const locationId = params.locationId as string;

  // Fetch location details
  const { data: location, isLoading: locationLoading } =
    useFetchLocation(locationId);

  // Fetch location staff
  const { data: staff = [], isLoading: staffLoading } =
    useFetchLocationStaff(locationId);

  const isLoading = locationLoading || staffLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={ROUTES.MANAGER_LOCATIONS}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Locations
          </Button>
        </Link>
        <div className="flex-1">
          {location ? (
            <>
              <h1 className="text-3xl font-bold tracking-tight">
                {location.name} - Staff
              </h1>
              <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {formatTimezone(location.timezone)}
                </div>
                {location.address && (
                  <div className="flex items-center gap-1">
                    <span>{location.address}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </>
          )}
        </div>
      </div>

      {/* Staff Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Users className="h-12 w-12 text-zinc-400 mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            No staff assigned
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            No staff members are certified to work at this location yet.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {staff.length} staff member{staff.length !== 1 ? "s" : ""}{" "}
              certified for this location
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((member) => (
              <Card
                key={member.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar
                      className="h-10 w-10"
                      fallback={getInitials(member.name)}
                      alt={member.name}
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {member.name}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-zinc-500">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Skills */}
                  {member.skills && member.skills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {member.skills.slice(0, 3).map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {member.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Desired Hours */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 text-zinc-500" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Wants {member.desiredWeeklyHours || 40}h/week
                    </span>
                  </div>

                  {/* Timezone */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3 w-3 text-zinc-500" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {formatTimezone(member.preferredTimezone)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
