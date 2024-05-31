import { List } from "@/src/shared/ui/list";
import { Skeleton } from "@/src/shared/ui/skeleton";

export const ListSkeleton = ({ viewMode }: { viewMode: string }) => (
  <List viewMode={viewMode as "grid" | "list"}>
    {Array.from({ length: 15 }, (_, index) => index + 1).map((index) =>
      viewMode === "grid" ? (
        <Skeleton className="h-[352px] w-[264px]" key={index} />
      ) : (
        <div
          className="flex w-full items-center justify-between gap-4"
          key={index}
        >
          <div className="flex gap-4">
            <Skeleton className="h-[120px] w-[90px]" />
            <div className="flex flex-col gap-1 self-center">
              <Skeleton className="h-8 w-[260px] md:w-[400px]" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex gap-4 xl:gap-8">
            <div className="flex flex-col gap-2 self-center">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-40 " />
            </div>
            <div className="flex gap-2 self-center lg:flex">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </div>
      )
    )}
  </List>
);
