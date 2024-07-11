"use client";

import { createReviewAction } from "@/src/features/add-review/api/action";
import { cn, playingOnPlatforms } from "@/src/shared/lib";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/shared/ui";
import { HiddenInput } from "@/src/shared/ui/hidden-input";
import { Label } from "@/src/shared/ui/label";
import { Textarea } from "@/src/shared/ui/textarea";
import { StarIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";


export function AddReviewForm({ gameId }: { gameId: string }) {
  const session = useSession();
  const [ratingValue, setRatingValue] = useState(0);
  const createReview = createReviewAction.bind(null, { message: "", type: "success" }, ratingValue)

  return (
    <form action={createReview}>
      <HiddenInput name="userId" value={session.data?.user?.id} />
      <HiddenInput name="gameId" value={gameId} />
      <HiddenInput name="rating" value={ratingValue} />
      <div className="mb-4 flex flex-col">
        <Label
          htmlFor="rating"
          className="mb-2 text-sm font-medium text-gray-700"
        >
          Rating
        </Label>
        <div className="flex items-center gap-2 my-2">
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
      <Button>Submit</Button>
    </form>
  );
}