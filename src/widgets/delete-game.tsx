"use client";

import { deleteGameAction } from "@/src/features/delete-game";
import { Button } from "@/src/shared/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/shared/ui/alert-dialog";
import { TrashIcon } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export function DeleteGame({ gameId }: { gameId: number }) {
  const [, action] = useActionState(deleteGameAction, { message: "" });
  const { pending } = useFormStatus();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="p-2">
          <TrashIcon className="color-text-secondary h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <form action={action}>
            <input name="gameId" defaultValue={gameId} className="sr-only" />
            <AlertDialogAction type="submit" disabled={pending}>
              Continue
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
