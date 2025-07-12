"use client";

import { StarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib";

import { createReview } from "../server-actions/create-review";

export function ReviewForm({ gameId }: { gameId: string }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await createReview({
        gameId,
        rating,
        content: reviewText,
      });
      setRating(0);
      setReviewText("");
      toast.success("Review submitted successfully");
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Write a Review</h3>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none"
            aria-label={`Set rating to ${star}`}
            name="rating"
          >
            <StarIcon
              className={cn("size-6 cursor-pointer hover:fill-primary/50", {
                "fill-primary": star <= rating,
                "fill-muted stroke-muted-foreground": star > rating,
              })}
            />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Share your thoughts about this game..."
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        className="min-h-[100px]"
      />
      <Button
        onClick={handleSubmitReview}
        disabled={rating === 0 || isSubmitting}
      >
        Submit Review
      </Button>
    </div>
  );
}
