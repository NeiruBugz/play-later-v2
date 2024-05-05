import { DashboardItemLayout } from "@/src/components/dashboard/dashboard-item-layout";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/packages/config/site";
import { getReviews } from "@/src/queries/dashboard/get-reviews";
import { ReviewItem } from "@/src/types/dashboard/review";
import { format } from "date-fns";
import { Newspaper } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";

const Review = ({ review }: { review: ReviewItem }) => {
  return (
    <div className="flex max-w-[320px] flex-col gap-2">
      <header className="flex items-center gap-2">
        <Image
          alt={`${review.game.title} artwork`}
          className="rounded-md object-cover"
          height={NEXT_IMAGE_SIZES["micro"].height}
          priority
          src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${review.game.imageUrl}.png`}
          width={NEXT_IMAGE_SIZES["micro"].width}
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

  console.log(reviews);

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
