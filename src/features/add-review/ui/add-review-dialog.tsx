import { Button } from "@/src/shared/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/shared/ui/dialog";
import { AddReviewForm } from "./add-review-form";

export function AddReviewDialog({
  gameId,
  gameTitle,
}: {
  gameId: string;
  gameTitle: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="my-2 w-full">Add review</Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{gameTitle}</DialogTitle>
          <DialogDescription>
            Share your thoughts on a game you&apos;ve played. Rate it, describe your experience, and select the platform you played on.
          </DialogDescription>
        </DialogHeader>
        <div className="my-3">
          <AddReviewForm gameId={gameId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
