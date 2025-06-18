"use client";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components";
import { HiddenInput } from "@/shared/components/hidden-input";
import { Label } from "@/shared/components/label";
import { BacklogStatusMapper, cn, playingOnPlatforms } from "@/shared/lib";
import { BacklogItemStatus } from "@prisma/client";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createBacklogItemAction } from "../server-actions/action";

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
  const [state, formAction] = useActionState(createBacklogItemAction, {
    message: "",
  });

  useEffect(() => {
    if (state.message === "Success") {
      toast.success("Success!", {
        description: "Backlog item created successfully",
      });
    } else if (state.message === "Error") {
      toast.error("Error!", {
        description: "Failed to create backlog item",
      });
    }
  }, [state.message]);

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
      <div className="flex justify-between gap-2">
        <Button variant="outline" type="reset">
          Cancel
        </Button>
        <SubmitEdit />
      </div>
    </form>
  );
}
