'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/src/shared/ui/alert-dialog";
import { TrashIcon } from "lucide-react";
import { useFormState, useFormStatus } from 'react-dom';
import { deleteGameAction } from "@/src/features/delete-game/api/action";
import { Button } from "@/src/shared/ui/button";

export function DeleteGame({ gameId }: { gameId: number }) {
  const [, action] = useFormState(deleteGameAction, { message: '' });
  const { pending } = useFormStatus();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="p-2">
        <TrashIcon className="w-4 h-4 color-text-secondary" /></Button>
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
          <AlertDialogCancel type="button" disabled={pending}>Cancel</AlertDialogCancel>
          <form action={action}>
            <input name="gameId" defaultValue={gameId} className="sr-only"/>
            <AlertDialogAction type="submit" disabled={pending}>Continue</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
