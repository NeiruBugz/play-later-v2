"use client";

import { TrashIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { HiddenInput } from "@/shared/components/hidden-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";

import { deleteLibraryItemAction } from "../server-actions/action";

export function DeleteLibraryItem({
  libraryItemId,
}: {
  libraryItemId: number;
}) {
  const { execute } = useAction(
    () => deleteLibraryItemAction({ id: libraryItemId }),
    {
      onSuccess: () => {
        toast.success("Library item deleted");
      },
      onError: () => {
        toast.error("Failed to delete library item");
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
              <HiddenInput name="id" value={libraryItemId} />
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
