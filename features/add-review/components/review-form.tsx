"use client";

import { ReviewService } from "@/domain/review/service";
import { Button } from "@/shared/components";
import { Textarea } from "@/shared/components/textarea";
import { Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { createReview } from "../server-actions/create-review";

export function ReviewForm({ gameId }: { gameId: string }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const session = useSession();

  const handleSubmitReview = async () => {
    if (rating === 0 || !reviewText.trim()) return;

    const userId = session.data?.user?.id;
    if (!userId) {
      return;
    }
    setIsSubmitting(true);
    try {
      await createReview({
        gameId,
        rating,
        userId,
        content: reviewText,
      });
      // Reset form
      setRating(0);
      setReviewText("");
    } catch (error) {
      console.error("Failed to submit review:", error);
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
          >
            <Star
              className={`h-6 w-6 ${rating >= star ? "fill-primary text-primary" : "text-muted-foreground"}`}
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
        disabled={rating === 0 || !reviewText.trim() || isSubmitting}
      >
        Submit Review
      </Button>
    </div>
  );
}
