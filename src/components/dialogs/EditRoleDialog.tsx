import { api, getErrorMessage } from "@/lib/api-client";
import { User, UserRole } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
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
import { ROLE_BADGE_STYLES } from "@/constants/role-config";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type Props = {
  member: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function EditRoleDialog({ member, open, onOpenChange }: Props) {
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
