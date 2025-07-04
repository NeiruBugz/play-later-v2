"use client";

import { Button } from "@/shared/components";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/alert-dialog";
import { HiddenInput } from "@/shared/components/hidden-input";
import { TrashIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { deleteBacklogItemAction } from "../server-actions/action";

export function DeleteBacklogItem({
  backlogItemId,
}: {
  backlogItemId: number;
}) {
  const { execute } = useAction(
    () => deleteBacklogItemAction({ id: backlogItemId }),
    {
      onSuccess: () => {
        toast.success("Backlog item deleted");
      },
      onError: () => {
        toast.error("Failed to delete backlog item");
      },
    }
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <TrashIcon className="mr-2 size-3" /> Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm item deletion</AlertDialogTitle>
        </AlertDialogHeader>
        <p>Are you sure you want to delete this item?</p>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="group bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
            asChild
          >
            <form action={execute}>
              <HiddenInput name="id" value={backlogItemId} />
              <Button variant="ghost" className="group-hover:bg-transparent">
                Delete
              </Button>
            </form>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
