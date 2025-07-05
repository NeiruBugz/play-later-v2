import { Star } from "lucide-react";

import { Button } from "@/shared/components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/dialog";

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
        <Button className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          <span>Write a Review</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{gameTitle}</DialogTitle>
          <DialogDescription>
            Share your thoughts on a game you&apos;ve played. Rate it, describe
            your experience, and select the platform you played on.
          </DialogDescription>
        </DialogHeader>
        <div className="my-3">
          <AddReviewForm gameId={gameId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
