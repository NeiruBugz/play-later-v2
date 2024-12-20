"use client";

import { DeleteBacklogItem } from "@/src/features/delete-backlog-item";
import { editBacklogItemAction } from "@/src/features/edit-backlog-item/api/action";
import { BacklogStatusMapper, cn, playingOnPlatforms } from "@/src/shared/lib";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/shared/ui";
import { HiddenInput } from "@/src/shared/ui/hidden-input";
import { Label } from "@/src/shared/ui/label";
import { useToast } from "@/src/shared/ui/use-toast";
import { BacklogItemStatus } from "@prisma/client";
import { format } from "date-fns";
import { useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";


function parseDate(dateString?: Date | null) {
  if (!dateString) return "";
  return format(dateString, "yyyy-MM-dd");
}

function SubmitEdit() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn("", { "animate-pulse": pending })}
    >
      Save changes
    </Button>
  );
}

export function EditBacklogItemForm({
  platform,
  status,
  entryId,
  startedAt,
  completedAt,
}: {
  platform?: string;
  status?: BacklogItemStatus;
  entryId: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
}) {
  const [state, formAction] = useActionState(editBacklogItemAction, {
    message: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (state.message === 'Success') {
      toast({
        title: "Success!",
        description: "Backlog item updated successfully",
      });
    }
  }, [state.message, toast])

  return (
    <form className="mb-4 flex flex-col gap-3" action={formAction}>
      <HiddenInput name="id" value={entryId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="platform">Platform of choice</Label>
        <Select name="platform" defaultValue={platform}>
          <SelectTrigger>
            <SelectValue placeholder="Select a platform" className="mt-2" />
          </SelectTrigger>
          <SelectContent>
            {playingOnPlatforms.map((platform) => (
              <SelectItem value={platform.value} key={platform.value}>
                {platform.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={status}>
          <SelectTrigger>
            <SelectValue placeholder="Select a status" className="mt-2" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(BacklogItemStatus).map((key) => (
              <SelectItem value={key} key={key}>
                {BacklogStatusMapper[key as BacklogItemStatus]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-between gap-2">
        <div className="flex w-fit flex-col gap-2">
          <Label>Start date</Label>
          <Input
            type="date"
            name="startedAt"
            defaultValue={parseDate(startedAt)}
          />
        </div>
        <div className="flex w-fit flex-col gap-2">
          <Label>Completion date</Label>
          <Input
            type="date"
            name="completedAt"
            defaultValue={parseDate(completedAt)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <DeleteBacklogItem backlogItemId={entryId} />
        <div className="flex gap-2">
          <Button variant="outline" type="reset">
            Cancel
          </Button>
          <SubmitEdit />
        </div>
      </div>
    </form>
  );
}