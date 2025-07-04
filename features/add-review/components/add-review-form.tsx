"use client";

import { StarIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components";
import { HiddenInput } from "@/shared/components/hidden-input";
import { Label } from "@/shared/components/label";
import { Textarea } from "@/shared/components/textarea";
import { cn, playingOnPlatforms } from "@/shared/lib";

import { createReviewForm } from "../server-actions/create-review";

export function AddReviewForm({ gameId }: { gameId: string }) {
  const session = useSession();
  const [ratingValue, setRatingValue] = useState(0);
  const { execute, isExecuting } = useAction(createReviewForm, {
    onSuccess: () => {
      toast.success("Review submitted successfully");
    },
    onError: () => {
      toast.error("Failed to submit review");
    },
  });

  return (
    <form action={execute}>
      <HiddenInput name="userId" value={session.data?.user?.id} />
      <HiddenInput name="gameId" value={gameId} />
      <HiddenInput name="rating" value={ratingValue} />
      <div className="mb-4 flex flex-col gap-2">
        <Label htmlFor="rating">Rating</Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <StarIcon
              key={value}
              onClick={() => setRatingValue(value)}
              className={cn("size-5 cursor-pointer hover:fill-primary/50", {
                "fill-primary": value <= ratingValue,
                "fill-muted stroke-muted-foreground": value > ratingValue,
              })}
            />
          ))}
        </div>
      </div>
      <div className="mb-4 flex flex-col gap-2">
        <Label htmlFor="content">Your Review</Label>
        <Textarea
          placeholder="Share your thoughts on the game"
          name="content"
        />
      </div>
      <div className="mb-4 flex flex-col gap-2">
        <Label htmlFor="completedOn">Platform of choice</Label>
        <Select name="completedOn" defaultValue={""}>
          <SelectTrigger>
            <SelectValue placeholder="Select a platform" className="mt-2" />
          </SelectTrigger>
          <SelectContent>
            {playingOnPlatforms.map((platform) => (
              <SelectItem value={platform.value} key={platform.value}>
                {platform.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button disabled={isExecuting}>Submit</Button>
    </form>
  );
}
