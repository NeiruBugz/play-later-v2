import type { Game } from "@prisma/client";
import { Trash } from "lucide-react";
import { deleteGame } from "@/src/entities/game/delete-game";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "@/src/shared/ui/alert-dialog";
import { Button } from "@/src/shared/ui/button";

export const DeleteAction = ({ id }: { id: Game["id"] }) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          aria-label="delete-game-dialog"
          size="icon"
          variant="destructive"
        >
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
              action={async () => {
                "use server";
                await deleteGame(id);
              }}
              className="!hover:bg-transparent block w-fit bg-destructive"
            >
              <Button type="submit" variant="destructive">
                Delete
              </Button>
            </form>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
