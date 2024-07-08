import { deleteBacklogItem } from "@/src/entities/backlog-item";
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

export function DeleteBacklogItem({
  backlogItemId,
}: {
  backlogItemId: number;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" className="size-4">
          <TrashIcon className="size-3" />
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
            <form
              action={async () => {
                "use server";
                await deleteBacklogItem(backlogItemId);
              }}
            >
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
