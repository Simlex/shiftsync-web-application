import { DATE_FORMATS } from "@/constants";
import { useFetchLocations } from "@/hooks/locations";
import { api, getErrorMessage } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Location } from "@/types";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
};

export default function CreateShiftDialog(props: Props) {
  const { open, onOpenChange, defaultDate } = props;

  const queryClient = useQueryClient();
  const { data: locations = [] } = useFetchLocations();

  const [locationId, setLocationId] = useState("");
  const [localDate, setLocalDate] = useState(
    defaultDate ?? DateTime.now().toFormat(DATE_FORMATS.DATE_ONLY),
  );
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [requiredSkill, setRequiredSkill] = useState("");
  const [requiredHeadcount, setRequiredHeadcount] = useState(1);

  const mutation = useMutation({
    mutationFn: () =>
      api.shifts.createShift({
        locationId,
        localDate,
        startTime,
        endTime,
        requiredSkill,
        requiredHeadcount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Shift created successfully");
      onOpenChange(false);
      // Reset form
      setLocationId("");
      setStartTime("09:00");
      setEndTime("17:00");
      setRequiredSkill("");
      setRequiredHeadcount(1);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const canSubmit =
    locationId && localDate && startTime && endTime && requiredSkill;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Shift</DialogTitle>
          <DialogDescription>
            Add a new shift to the schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Location */}
          <div className="space-y-1.5">
            <Label>Location</Label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="">Select location...</option>
              {locations.map((loc: Location) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
            />
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Required Skill */}
          <div className="space-y-1.5">
            <Label>Required Skill</Label>
            <Input
              placeholder="e.g. Barista, Cashier..."
              value={requiredSkill}
              onChange={(e) => setRequiredSkill(e.target.value)}
            />
          </div>

          {/* Headcount */}
          <div className="space-y-1.5">
            <Label>Required Headcount</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={requiredHeadcount}
              onChange={(e) =>
                setRequiredHeadcount(parseInt(e.target.value) || 1)
              }
            />
          </div>
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
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending ? "Creating..." : "Create Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
