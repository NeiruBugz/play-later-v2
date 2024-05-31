import { format } from "date-fns";
import { ReviewItem } from "@/src/types/dashboard/review";
import { getGameReviews } from "@/src/entities/review/get-reviews";
import { CustomImage } from "@/src/shared/ui/custom-image";

const Review = ({
  imageUrl,
  name,
  review,
}: {
  imageUrl: string;
  name: string;
  review: Omit<ReviewItem, "game">;
}) => {
  return (
    <div className="flex max-w-[320px] flex-col gap-2">
      <header className="flex items-center gap-2">
        <CustomImage
          alt={`${name} artwork`}
          className="rounded-md object-cover"
          imageUrl={imageUrl}
          priority
          size="micro"
        />
        <div className="flex flex-col">
          <p>
            <span className="font-bold">{name}</span> by{" "}
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

export async function ReviewList({
  gameId,
  imageUrl,
  name,
}: {
  gameId: string;
  imageUrl: string;
  name: string;
}) {
  const reviews = await getGameReviews(gameId);
  return (
    <section className="container mx-auto hidden py-4 md:block md:py-6">
      <div className="flex flex-wrap items-center gap-4">
        {reviews.map((review) => (
          <Review
            imageUrl={imageUrl}
            key={review.id}
            name={name}
            review={review}
          />
        ))}
      </div>
    </section>
  );
}
