import {
  Card,
  CardContent,
  CardHeader,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

function FeedItemSkeleton() {
  return (
    <div className="flex gap-3 py-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>

          <Skeleton className="h-12 w-9 shrink-0 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <Card variant="flat">
      <CardHeader spacing="comfortable">
        <Skeleton className="h-6 w-32" variant="title" />
      </CardHeader>

      <CardContent spacing="comfortable">
        <div className="divide-border/40 divide-y">
          {[...Array(4)].map((_, i) => (
            <FeedItemSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
