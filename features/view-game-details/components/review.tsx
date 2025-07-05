import type { Review, User } from "@prisma/client";
import { format } from "date-fns";
import { Flag, Star, StarIcon, ThumbsUp } from "lucide-react";

import { Button } from "@/shared/components";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/avatar";
import { Card, CardContent, CardHeader } from "@/shared/components/card";
import { cn, normalizeString } from "@/shared/lib";

const getFirstTwoLiterals = (name: string | null | undefined) => {
  if (!name) {
    return "U";
  }

  const [firstName, lastName] = name.split(" ");

  return firstName.charAt(0).toUpperCase() + lastName?.charAt(0).toUpperCase();
};

export function Review({ review }: { review: Review & { User: User } }) {
  return (
    <div key={review.id} className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage
              src={review.User.image || "/placeholder.svg"}
              alt={review.User.name || ""}
            />
            <AvatarFallback>
              {getFirstTwoLiterals(review.User.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{review.User.name}</p>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${review.rating >= star ? "fill-primary text-primary" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(review.createdAt, "dd.MM.yyyy, hh:mm")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm">{review.content}</p>

      {/* <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-1 text-xs ${review.isLiked ? "text-primary" : ""}`}
        >
          <ThumbsUp className="h-3 w-3" />
          <span>Helpful ({review.likes})</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-xs"
        >
          <Flag className="h-3 w-3" />
          <span>Report</span>
        </Button>
      </div> */}
    </div>
  );
}
