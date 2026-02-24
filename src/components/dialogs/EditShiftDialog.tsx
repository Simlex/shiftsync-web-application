import { DATE_FORMATS } from "@/constants";
import { api, getErrorMessage } from "@/lib/api-client";
import { timezone } from "@/lib/timezone";
import { Shift } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";

type Props = {
  shift: Shift;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userTimezone: string;
};

export default function EditShiftDialog({
  shift,
  open,
  onOpenChange,
  userTimezone,
}: Props) {
  const queryClient = useQueryClient();

  const shiftStart = timezone.toUserTime(shift.startTime, userTimezone);
  const shiftEnd = timezone.toUserTime(shift.endTime, userTimezone);

  const [localDate, setLocalDate] = useState(
    shiftStart.toFormat(DATE_FORMATS.DATE_ONLY),
  );
  const [startTime, setStartTime] = useState(
    shiftStart.toFormat(DATE_FORMATS.TIME_ONLY),
  );
  const [endTime, setEndTime] = useState(
    shiftEnd.toFormat(DATE_FORMATS.TIME_ONLY),
  );
  const [requiredSkill, setRequiredSkill] = useState(shift.requiredSkill);
  const [requiredHeadcount, setRequiredHeadcount] = useState(
    shift.requiredHeadcount,
  );

  const updateMutation = useMutation({
    mutationFn: () =>
      api.shifts.updateShift(shift.id, {
        localDate,
        startTime,
        endTime,
        requiredSkill,
        requiredHeadcount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Shift updated successfully");
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.shifts.deleteShift(shift.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Shift deleted");
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });

  const isPending = updateMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Shift</DialogTitle>
          <DialogDescription>
            {shift.location?.name ?? "Unknown Location"} ·{" "}
            {shiftStart.toFormat(DATE_FORMATS.WEEK_DAY_DATE)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Date */}
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
              disabled={isPending}
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
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Required Skill */}
          <div className="space-y-1.5">
            <Label>Required Skill</Label>
            <Input
              value={requiredSkill}
              onChange={(e) => setRequiredSkill(e.target.value)}
              disabled={isPending}
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
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteMutation.mutate()}
            disabled={isPending}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
