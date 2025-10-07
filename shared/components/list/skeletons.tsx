import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="h-full overflow-hidden">
          <div className="aspect-[16/9]">
            <Skeleton className="size-full" />
          </div>
          <CardHeader className="p-3 pb-2">
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
