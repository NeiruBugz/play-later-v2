"use client";

import { BacklogItemStatus } from "@prisma/client";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useAction } from "next-safe-action/hooks";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { HiddenInput } from "@/shared/components/hidden-input";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { BacklogStatusMapper, cn, playingOnPlatforms } from "@/shared/lib";

import { createBacklogItem } from "../server-actions/action";

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
  const { execute } = useAction(createBacklogItem, {
    onSuccess: () => {
      toast.success("Backlog item created");
    },
    onError: () => {
      toast.error("Failed to create backlog item");
    },
  });

  return (
    <form className="mb-4 flex flex-col gap-3" action={execute}>
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
