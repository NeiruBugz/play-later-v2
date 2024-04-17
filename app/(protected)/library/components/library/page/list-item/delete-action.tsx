import { Game } from "@prisma/client";
import { Trash } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { deleteGame } from "@/app/(protected)/library/lib/actions/delete-game";

export const DeleteAction = ({ id }: { id: Game["id"] }) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon">
          <Trash className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>Delete game</AlertDialogHeader>
        <AlertDialogDescription>
          This action cannot be undone. This will delete this game from your
          library.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            asChild
            className="w-fit bg-transparent hover:bg-transparent"
          >
            <form
              className="!hover:bg-transparent block w-fit bg-destructive"
              action={async () => {
                "use server";
                await deleteGame(id);
              }}
            >
              <Button variant="destructive" type="submit">
                Delete
              </Button>
            </form>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
