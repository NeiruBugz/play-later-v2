import { format } from "date-fns";
import { Newspaper } from "lucide-react";
import { Suspense } from "react";

import type { ReviewItem } from "@/src/shared/types";
import { CustomImage } from "@/src/shared/ui/custom-image";
import { ScrollArea } from "@/src/shared/ui/scroll-area";

import { getReviews } from "@/src/entities/review/api/get-reviews";

import { DashboardItemLayout } from "./dashboard-item-layout";

const Review = ({ review }: { review: ReviewItem }) => {
  return (
    <div className="flex max-w-[320px] flex-col gap-2">
      <header className="flex items-center gap-2">
        <CustomImage
          alt={`${review.game.title} artwork`}
          className="rounded-md object-cover"
          imageUrl={review.game.imageUrl}
          priority
          size="micro"
        />
        <div className="flex flex-col">
          <p>
            <span className="font-bold">{review.game.title}</span> by{" "}
            <span className="font-bold">
              {review.author.username ?? review.author.name}
            </span>
          </p>
          <p>{format(review.createdAt, "dd MMM, yyyy")}</p>
        </div>
      </header>
      <p>{review.content}</p>
    </div>
  );
};

export async function ReviewList() {
  const reviews = await getReviews();

  if (!reviews.length) {
    return null;
  }

  return (
    <DashboardItemLayout
      heading={
        <>
          <Newspaper className="mr-2 h-4 w-4" />
          Reviews
        </>
      }
    >
      <ScrollArea className="h-72 max-w-[660px] md:columns-2">
        {reviews.map((review) => (
          <Review key={review.id} review={review} />
        ))}
      </ScrollArea>
    </DashboardItemLayout>
  );
}

export function ReviewsWidget() {
  return (
    <section className="mt-2">
      <Suspense fallback="Loading...">
        <ReviewList />
      </Suspense>
    </section>
  );
}
