"use client";

import { deleteBacklogItem } from "@/src/entities/backlog-item";
import { deleteBacklogItemAction } from "@/src/features/delete-backlog-item/api/action";
import { Button } from "@/src/shared/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/shared/ui/alert-dialog";
import { TrashIcon } from "lucide-react";
import { useFormState } from "react-dom";

export function DeleteBacklogItem({
  backlogItemId,
}: {
  backlogItemId: number;
}) {
  const deleteBacklogItem = deleteBacklogItemAction.bind(
    null,
    { message: "" },
    backlogItemId
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
            <form action={deleteBacklogItem}>
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
