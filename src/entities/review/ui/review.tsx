import { cn } from "@/src/shared/lib";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/shared/ui/avatar";
import { Card, CardContent, CardHeader } from "@/src/shared/ui/card";
import type { Review, User } from "@prisma/client";
import { format } from "date-fns";
import { StarIcon } from "lucide-react";

const getFirstTwoLiterals = (name: string | null | undefined) => {
  if (!name) {
    return "U";
  }

  const [firstName, lastName] = name.split(" ");

  return firstName.charAt(0).toUpperCase() + lastName?.charAt(0).toUpperCase();
};

export function Review({ review }: { review: Review & { User: User } }) {
  return (
    <Card className="h-fit w-full max-w-full md:max-w-md">
      <CardHeader className="flex-wrap bg-muted/20 p-3 md:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-12 w-12 rounded border">
            <AvatarImage src={review.User.image ?? ""} className="rounded" />
            <AvatarFallback className="rounded">
              {getFirstTwoLiterals(review.User.name)}
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <div className="font-semibold">
              {review.User.username ?? review.User.name}&nbsp;
              <span className="font-normal">on</span>&nbsp;{review.completedOn}
            </div>
            <div className="flex items-center gap-0.5 text-sm">
              {Array.from({ length: 10 }, (_, i) => (
                <StarIcon
                  className={cn("h-4 w-4", {
                    "fill-primary": i + 1 <= review.rating,
                    "fill-muted stroke-muted-foreground": i + 1 > review.rating,
                  })}
                  key={i}
                />
              ))}
            </div>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {format(review.createdAt, "dd.MM.yyyy")}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        <div className="grid gap-4 text-sm leading-loose">
          <p>{review.content}</p>
        </div>
      </CardContent>
    </Card>
  );
}
