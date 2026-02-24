"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Globe,
  Clock,
  Building2,
  Search,
  Users,
  Calendar,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { extractData } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Location } from "@/types";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function ManagerLocationsPage() {
  const [search, setSearch] = useState("");

  // Fetch managed locations
  const {
    data: locationsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["locations", "managed"],
    queryFn: async () => {
      const res = await api.locations.getManagedLocations();
      return res.data;
    },
    retry: false,
  });

  const locations = extractData<Location>(locationsData);

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(search.toLowerCase()) ||
      location.timezone.toLowerCase().includes(search.toLowerCase()) ||
      (location.address &&
        location.address.toLowerCase().includes(search.toLowerCase())),
  );

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Building2 className="h-12 w-12 text-zinc-400 mb-4" />
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Failed to load locations
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          There was an error loading your managed locations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Locations</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Locations you manage and their current status
          </p>
        </div>
        <Link href={ROUTES.MANAGER_SCHEDULE}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Shift
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Search locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Building2 className="h-12 w-12 text-zinc-400 mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {search ? "No locations found" : "No managed locations"}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            {search
              ? "Try adjusting your search terms."
              : "You haven't been assigned to manage any locations yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.map((location) => (
            <Card
              key={location.id}
              className="group hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Globe className="h-3 w-3" />
                      {location.timezone}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Manager
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {location.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-3 w-3 text-zinc-500 shrink-0" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {location.address}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-zinc-500" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {(location as any)._count?.certifications || 0} staff
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-zinc-500" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {(location as any)._count?.shifts || 0} shifts
                    </span>
                  </div>
                </div>

                {location.createdAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 text-zinc-500" />
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Added {new Date(location.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Link
                    href={`${ROUTES.MANAGER_SCHEDULE}?locationId=${location.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      <Calendar className="mr-1 h-3 w-3" />
                      View Schedule
                    </Button>
                  </Link>
                  <Link
                    href={`/manager/locations/${location.id}/staff`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      <Users className="mr-1 h-3 w-3" />
                      Manage Staff
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
