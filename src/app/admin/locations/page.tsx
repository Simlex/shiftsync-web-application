"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Globe,
  Clock,
  Building2,
  Search,
  Users,
  UserPlus,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Location } from "@/types";
import { useFetchUsers } from "@/hooks/users";
import { useFetchLocations } from "@/hooks/locations";

// Common timezone options
const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "Europe/London", label: "GMT (London)" },
  { value: "Europe/Paris", label: "CET (Paris)" },
  { value: "Asia/Tokyo", label: "JST (Tokyo)" },
  { value: "Australia/Sydney", label: "AEST (Sydney)" },
  { value: "Africa/Lagos", label: "WAT (Lagos)" },
  { value: "UTC", label: "UTC" },
];

interface LocationFormData {
  name: string;
  timezone: string;
  address: string;
  cutoffHours: number;
}

const initialFormData: LocationFormData = {
  name: "",
  timezone: "",
  address: "",
  cutoffHours: 48,
};

export default function LocationManagementPage() {
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [formData, setFormData] = useState<LocationFormData>(initialFormData);

  const queryClient = useQueryClient();

  // Fetch locations using proper hook
  const { data: locations, isLoading, isError } = useFetchLocations();

  // Fetch all managers for assignment using proper hook
  const { data: managers = [] } = useFetchUsers({ role: "MANAGER" });

  // Create location mutation
  const createLocation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      const res = await api.locations.createLocation(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setCreateDialogOpen(false);
      setFormData(initialFormData);
      toast.success("Location created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create location");
    },
  });

  // Update location mutation
  const updateLocation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<LocationFormData>;
    }) => {
      const res = await api.locations.updateLocation(id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setEditDialogOpen(false);
      setEditingLocation(null);
      setFormData(initialFormData);
      toast.success("Location updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update location");
    },
  });

  // Delete location mutation
  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.locations.deleteLocation(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete location");
    },
  });

  // Assign manager mutation
  const assignManager = useMutation({
    mutationFn: async ({
      locationId,
      managerId,
    }: {
      locationId: string;
      managerId: string;
    }) => {
      const res = await api.locations.assignManager(locationId, managerId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setManagerDialogOpen(false);
      setSelectedLocation(null);
      setSelectedManagerId("");
      toast.success("Manager assigned successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to assign manager");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.timezone) {
      toast.error("Name and timezone are required");
      return;
    }
    createLocation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation || !formData.name.trim() || !formData.timezone) {
      toast.error("Name and timezone are required");
      return;
    }
    updateLocation.mutate({ id: editingLocation.id, data: formData });
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      timezone: location.timezone,
      address: location.address || "",
      cutoffHours: 48, // Default since it's not in the Location type
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (location: Location) => {
    if (window.confirm(`Are you sure you want to delete "${location.name}"?`)) {
      deleteLocation.mutate(location.id);
    }
  };

  const handleAssignManager = (location: Location) => {
    setSelectedLocation(location);
    setManagerDialogOpen(true);
  };

  const handleManagerAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation || !selectedManagerId) {
      toast.error("Please select a manager");
      return;
    }
    assignManager.mutate({
      locationId: selectedLocation.id,
      managerId: selectedManagerId,
    });
  };

  const filteredLocations = (locations || []).filter(
    (location) =>
      location.name.toLowerCase().includes(search.toLowerCase()) ||
      location.timezone.toLowerCase().includes(search.toLowerCase()) ||
      (location.address &&
        location.address.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Location Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage business locations and their settings
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-106.25">
            <DialogHeader>
              <DialogTitle>Create New Location</DialogTitle>
              <DialogDescription>
                Add a new business location to the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Downtown Branch"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) =>
                      setFormData({ ...formData, timezone: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="123 Main St, City, State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cutoffHours">Cutoff Hours</Label>
                  <Input
                    id="cutoffHours"
                    type="number"
                    value={formData.cutoffHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cutoffHours: parseInt(e.target.value) || 48,
                      })
                    }
                    min="0"
                    placeholder="48"
                  />
                  <p className="text-xs text-zinc-500">
                    Hours before shift start when changes are no longer allowed
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createLocation.isPending}>
                  {createLocation.isPending ? "Creating..." : "Create Location"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Locations Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError || filteredLocations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-medium">
              {isError ? "Failed to load locations" : "No locations found"}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isError
                ? "Please try again later"
                : "Get started by creating your first location"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.map((location) => (
            <Card key={location.id} className="group relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Globe className="h-3 w-3" />
                      {location.timezone}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(location)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(location)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
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
                      {location.managers.length || 0} managers
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
                      Created{" "}
                      {new Date(location.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleAssignManager(location)}
                  >
                    <UserPlus className="mr-1 h-3 w-3" />
                    Assign Manager
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the location information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Location Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Downtown Branch"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) =>
                    setFormData({ ...formData, timezone: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address (Optional)</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cutoffHours">Cutoff Hours</Label>
                <Input
                  id="edit-cutoffHours"
                  type="number"
                  value={formData.cutoffHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cutoffHours: parseInt(e.target.value) || 48,
                    })
                  }
                  min="0"
                  placeholder="48"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateLocation.isPending}>
                {updateLocation.isPending ? "Updating..." : "Update Location"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manager Assignment Dialog */}
      <Dialog open={managerDialogOpen} onOpenChange={setManagerDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Assign Manager</DialogTitle>
            <DialogDescription>
              Assign a manager to {selectedLocation?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManagerAssignSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="manager">Select Manager</Label>
                <Select
                  value={selectedManagerId}
                  onValueChange={(value) => setSelectedManagerId(value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name} ({manager.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setManagerDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={assignManager.isPending}>
                {assignManager.isPending ? "Assigning..." : "Assign Manager"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
