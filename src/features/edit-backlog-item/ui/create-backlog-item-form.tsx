"use client";

import { DeleteBacklogItem } from "@/src/features/delete-backlog-item";
import { createBacklogItemAction, editBacklogItemAction } from "@/src/features/edit-backlog-item/api/action";
import { BacklogStatusMapper, cn, playingOnPlatforms } from "@/src/shared/lib";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/ui";
import { HiddenInput } from "@/src/shared/ui/hidden-input";
import { Label } from "@/src/shared/ui/label";
import { useToast } from "@/src/shared/ui/use-toast";
import { BacklogItemStatus } from "@prisma/client";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";

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
      Create
    </Button>
  );
}

export function CreateBacklogItemForm({ gameId }: { gameId: string }) {
  const session = useSession();
  const [state, formAction] = useFormState(createBacklogItemAction, {
    message: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    if (state.message === "Success") {
      toast({
        title: "Success!",
        description: "Backlog item created successfully",
      });
    }
  }, [state.message, toast]);

  return (
    <form className="mb-4 flex flex-col gap-3" action={formAction}>
      <HiddenInput name="gameId" value={gameId} />
      <HiddenInput name="userId" value={session.data?.user?.id} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="platform">Platform of choice</Label>
        <Select name="platform" defaultValue={""}>
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
        <Select name="status" defaultValue={""}>
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
        <div className="flex w-full flex-col gap-2">
          <Label>Start date</Label>
          <Input
            type="date"
            name="startedAt"
            defaultValue={parseDate(new Date())}
          />
        </div>
        <div className="flex w-full flex-col gap-2">
          <Label>Completion date</Label>
          <Input type="date" name="completedAt" defaultValue={""} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
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
