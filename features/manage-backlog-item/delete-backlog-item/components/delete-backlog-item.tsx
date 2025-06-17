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
import { TrashIcon } from "lucide-react";
import { useFormState } from "react-dom";
import { deleteBacklogItemAction } from "../server-actions/action";

export function DeleteBacklogItem({
  backlogItemId,
}: {
  backlogItemId: number;
}) {
  const [state, formAction] = useFormState(
    (prevState: any, formData: FormData) =>
      deleteBacklogItemAction({ message: "" }, backlogItemId, formData),
    { message: "" }
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
            <form action={formAction}>
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
