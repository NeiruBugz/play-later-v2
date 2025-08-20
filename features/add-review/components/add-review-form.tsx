"use client";

import { StarIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { HiddenInput } from "@/shared/components/hidden-input";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn, playingOnPlatforms } from "@/shared/lib";

import { createReviewForm } from "../server-actions/create-review";

export function AddReviewForm({ gameId }: { gameId: string }) {
  const [ratingValue, setRatingValue] = useState(0);
  const { execute, isExecuting } = useAction(createReviewForm, {
    onSuccess: () => {
      setRatingValue(0);
      toast.success("Review submitted successfully");
    },
    onError: (error) => {
      console.log(error);
      toast.error("Failed to submit review");
    },
  });

  const isFormDisabled = isExecuting || ratingValue === 0;

  const executeWithTransform = (formData: FormData) => {
    const input = {
      gameId,
      rating: ratingValue,
      content: formData.get("content") as string,
      completedOn: formData.get("completedOn") as string,
    };
    execute(input);
  };

  return (
    <form action={executeWithTransform}>
      <HiddenInput name="gameId" value={gameId} />
      <div className="mb-4 flex flex-col gap-2">
        <Label htmlFor="rating">Rating</Label>
        <HiddenInput
          name="rating"
          value={ratingValue}
          aria-label="rating-value"
        />
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => {
                setRatingValue(value);
              }}
              aria-label={`Set rating to ${value}`}
              name="rating"
            >
              <StarIcon
                className={cn("size-5 cursor-pointer hover:fill-primary/50", {
                  "fill-primary": value <= ratingValue,
                  "fill-muted stroke-muted-foreground": value > ratingValue,
                })}
              />
            </button>
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
      <Button disabled={isFormDisabled}>Submit</Button>
    </form>
  );
}
