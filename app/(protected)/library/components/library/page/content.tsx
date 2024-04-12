import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { LibraryContentProps } from "@/lib/types/library";

import { Card } from "@/app/(protected)/library/components/game/ui/card/card";
import { List } from "@/app/(protected)/library/components/library/page/list";

function EmptyBacklog() {
  return (
    <p className="text-lg font-bold">Congratulations! Your backlog is empty!</p>
  );
}

const ListSkeleton = () => (
  <List>
    {Array.from({ length: 15 }, (_, index) => index + 1).map((index) => (
      <Skeleton className="h-[352px] w-[264px]" key={index} />
    ))}
  </List>
);

function BacklogList({
  count,
  backlogTime,
}: {
  count: number;
  backlogTime: number;
}) {
  if (count === 0) {
    return <EmptyBacklog />;
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-lg font-bold">
        Total backlog time is {backlogTime} hours and includes {count} game(s)
      </p>
    </div>
  );
}

export function LibraryContent({
  currentStatus,
  totalBacklogTime,
  backloggedLength,
  list,
}: LibraryContentProps) {
  return (
    <div>
      <Suspense fallback={<ListSkeleton />}>
        {currentStatus === "BACKLOG" ? (
          <BacklogList
            count={backloggedLength}
            backlogTime={totalBacklogTime}
          />
        ) : null}
        <List>
          {list.map((game) => (
            <Card key={game.id} game={game} />
          ))}
        </List>
      </Suspense>
    </div>
  );
}
