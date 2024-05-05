import { Skeleton } from "@/src/components/ui/skeleton";

export const ListSkeleton = ({ length = 4 }: { length?: number }) => (
  <div className="flex w-full justify-center gap-3">
    {Array.from({ length }).map((_, index) => {
      return (
        <div
          className="relative flex flex-col items-center gap-1.5"
          key={index}
        >
          <Skeleton className="h-[160px] w-[120px]" />
          <Skeleton className="h-[22px] w-[80px]" />
        </div>
      );
    })}
  </div>
);
